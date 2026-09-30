// Remplit les tables books et verses à partir de data/bible.db (SQLite, AELF),
// puis la table passages à partir de db/passages.js.
// Rejouable : on vide les tables avant de les remplir, dans une transaction.
// Usage : npm run seed

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { passages } from '../db/passages.js';

const BATCH_SIZE = 1000;
const SOURCE_PATH = fileURLToPath(new URL('../data/bible.db', import.meta.url));

const source = readSource();

await withTransaction(async (client) => {
  await clearTables(client);
  const bookIds = await insertBooks(client, source.books);
  await insertVerses(client, source.verses, bookIds);
  await insertPassages(client, passages, bookIds);
});

console.log(
  `Seed terminé : ${source.books.length} livres, ${source.verses.length} versets, ${passages.length} passages.`,
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
  await client.query('TRUNCATE passages, verses, books RESTART IDENTITY');
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

// Insère les passages dans l'ordre de la liste, après avoir vérifié leurs bornes.
async function insertPassages(client, passages, bookIds) {
  for (const [index, passage] of passages.entries()) {
    await insertPassage(client, passage, index + 1, bookIds);
  }
}

async function insertPassage(client, passage, position, bookIds) {
  const bookId = requireBookId(passage, bookIds);
  // Dans passages.js, les bornes sont des nombres ; en base, chapter et verse sont du texte
  const start = passage.start.map(String);
  const end = passage.end.map(String);

  await requireValidBounds(client, passage, bookId, start, end);

  await client.query(
    `INSERT INTO passages (position, title, book_id, start_chapter, start_verse, end_chapter, end_verse)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [position, passage.title, bookId, ...start, ...end],
  );
}

// --- Validation des passages (le seed s'arrête à la première erreur) ---

function requireBookId(passage, bookIds) {
  const bookId = bookIds.get(passage.book);
  if (!bookId) {
    throw new Error(`Passage "${passage.title}" : livre ${passage.book} introuvable.`);
  }
  return bookId;
}

// Vérifie que le début et la fin existent, et que le début vient avant la fin.
async function requireValidBounds(client, passage, bookId, start, end) {
  const startPosition = await requireVersePosition(client, passage, bookId, start);
  const endPosition = await requireVersePosition(client, passage, bookId, end);

  if (startPosition > endPosition) {
    throw new Error(`Passage "${passage.title}" : le début est après la fin.`);
  }
}

// Renvoie la position du verset [chapitre, verset], ou lève une erreur s'il n'existe pas.
async function requireVersePosition(client, passage, bookId, [chapter, verse]) {
  const result = await client.query(
    'SELECT position FROM verses WHERE book_id = $1 AND chapter = $2 AND verse = $3',
    [bookId, chapter, verse],
  );

  if (result.rows.length === 0) {
    throw new Error(`Passage "${passage.title}" : ${passage.book} ${chapter},${verse} introuvable.`);
  }
  return result.rows[0].position;
}
