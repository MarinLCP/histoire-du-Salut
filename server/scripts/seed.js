// Remplit les tables books, verses et chapters à partir de data/bible.db (SQLite, AELF),
// puis les tables epochs et passages à partir de db/epochs.data.js et db/passages.data.js.
// Les livres sont rangés dans l'ordre d'une Bible catholique (Psaumes après Job : voir bibleOrder.js).
// Rejouable : on vide les tables avant de les remplir, dans une transaction.
// Usage : npm run seed

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { epochs } from '../db/epochs.data.js';
import { passages } from '../db/passages.data.js';
import { validatePassages } from './passageRules.js';
import { validateEpochs } from './epochRules.js';
import { canonicalBookOrder, chaptersInReadingOrder } from './bibleOrder.js';

const BATCH_SIZE = 1000;
const SOURCE_PATH = fileURLToPath(new URL('../data/bible.db', import.meta.url));

const source = readSource();
const books = canonicalBookOrder(source.books);
const chapters = chaptersInReadingOrder(books, source.verses);
// Une faute dans passages.data.js ou epochs.data.js arrête le seed ICI, avant de toucher à la base
validatePassages(passages, source.verses);
validateEpochs(epochs, passages);

await withTransaction(async (client) => {
  await clearTables(client);
  const bookIds = await insertBooks(client, books);
  await insertVerses(client, source.verses, bookIds);
  await insertChapters(client, chapters, bookIds);
  const epochIds = await insertEpochs(client, epochs);
  await insertPassages(client, passages, bookIds, epochIds);
});

console.log(
  `Seed terminé : ${books.length} livres, ${chapters.length} chapitres, ${source.verses.length} versets, `
  + `${epochs.length} époques, ${passages.length} passages.`,
);

// --- Lecture de la source ---

// Lit les livres et les versets de la source SQLite.
function readSource() {
  const database = new DatabaseSync(SOURCE_PATH, { readOnly: true });

  // Dans la source, les rowid suivent l'ordre de lecture de la Bible.
  // On ne peut pas utiliser la colonne book_id : chaque psaume y a le sien.
  // L'ordre d'un livre = l'ordre de son premier verset.
  const books = database
    .prepare('SELECT book AS code, book_title AS title FROM verses GROUP BY book ORDER BY MIN(rowid)')
    .all();
  const verses = database
    .prepare('SELECT book AS code, chapter, verse, text FROM verses ORDER BY rowid')
    .all();

  database.close();
  return { books, verses };
}

// --- Écriture dans PostgreSQL ---

// Exécute `work` dans une transaction : soit tout réussit, soit rien n'est enregistré.
async function withTransaction(work) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('BEGIN');
    await work(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

// Pas de CASCADE : si une autre table pointe un jour vers ces tables
// (ex. des surlignages), Postgres refusera au lieu d'effacer ces données.
async function clearTables(client) {
  await client.query('TRUNCATE passages, epochs, chapters, verses, books RESTART IDENTITY');
}

// Insère les livres (seulement 74, un par un) et renvoie une Map : code du livre -> id.
async function insertBooks(client, books) {
  const bookIds = new Map();

  for (const [index, book] of books.entries()) {
    const result = await client.query(
      'INSERT INTO books (code, title, position) VALUES ($1, $2, $3) RETURNING id',
      [book.code, book.title, index + 1],
    );
    bookIds.set(book.code, result.rows[0].id);
  }

  return bookIds;
}

// Insère les versets par lots : une requête de 1000 lignes est bien plus rapide
// que 1000 requêtes d'une ligne.
async function insertVerses(client, verses, bookIds) {
  for (let start = 0; start < verses.length; start += BATCH_SIZE) {
    const batch = verses.slice(start, start + BATCH_SIZE);
    await insertVerseBatch(client, batch, start + 1, bookIds);
  }
}

// Insère un lot de versets en une seule requête. firstPosition = position du premier verset du lot.
async function insertVerseBatch(client, batch, firstPosition, bookIds) {
  const rows = batch.map((verse, index) => [
    bookIds.get(verse.code),
    verse.chapter,
    verse.verse,
    verseKind(verse),
    verse.text,
    firstPosition + index,
  ]);

  await client.query(
    `INSERT INTO verses (book_id, chapter, verse, kind, text, position) VALUES ${placeholdersFor(rows)}`,
    rows.flat(),
  );
}

// Les chapitres, dans l'ordre de lecture (position 1, 2, 3...), en une seule requête (1 332 lignes)
async function insertChapters(client, chapters, bookIds) {
  const rows = chapters.map((chapter, index) => [bookIds.get(chapter.code), chapter.label, index + 1]);
  await client.query(`INSERT INTO chapters (book_id, label, position) VALUES ${placeholdersFor(rows)}`, rows.flat());
}

// Quelques lignes de la source n'ont pas de numéro (ex. "ELLE" dans le Cantique)
function verseKind(verse) {
  return verse.verse === null ? 'unnumbered' : 'verse';
}

// Pour 2 lignes de 3 colonnes : "($1, $2, $3), ($4, $5, $6)"
function placeholdersFor(rows) {
  return rows.map((row, rowIndex) => placeholdersForRow(rowIndex, row.length)).join(', ');
}

// La ligne n°1 (2e ligne) de 3 colonnes utilise $4, $5, $6
function placeholdersForRow(rowIndex, columnCount) {
  const firstNumber = rowIndex * columnCount + 1;
  const placeholders = [];

  for (let number = firstNumber; number < firstNumber + columnCount; number++) {
    placeholders.push(`$${number}`);
  }
  return `(${placeholders.join(', ')})`;
}

// Insère les époques (une dizaine, une par une) et renvoie une Map : slug de l'époque -> id.
async function insertEpochs(client, epochs) {
  const epochIds = new Map();

  for (const [index, epoch] of epochs.entries()) {
    const result = await client.query(
      'INSERT INTO epochs (slug, title, icon, position) VALUES ($1, $2, $3, $4) RETURNING id',
      [epoch.slug, epoch.title, epoch.icon, index + 1],
    );
    epochIds.set(epoch.slug, result.rows[0].id);
  }

  return epochIds;
}

// Insère les passages dans l'ordre de la liste (déjà vérifiés par validatePassages et validateEpochs).
// Les id des versets de début et de fin sont retrouvés par la base elle-même (sous-requêtes).
async function insertPassages(client, passages, bookIds, epochIds) {
  for (const [index, passage] of passages.entries()) {
    await client.query(
      `INSERT INTO passages (position, slug, title, book_id, start_chapter, start_verse, end_chapter, end_verse,
                             epoch_id, icon, start_verse_id, end_verse_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
               (SELECT id FROM verses WHERE book_id = $4 AND chapter = $5 AND verse = $6),
               (SELECT id FROM verses WHERE book_id = $4 AND chapter = $7 AND verse = $8))`,
      [index + 1, passage.slug, passage.title, bookIds.get(passage.book), ...passage.start, ...passage.end,
        epochIds.get(passage.epoch), passage.icon],
    );
  }
}
