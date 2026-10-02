// Remplit les tables books, verses et chapters à partir de data/bible.db (SQLite, AELF),
// bible_groups à partir de db/bible-groups.data.js,
// puis les tables epochs et passages à partir de db/epochs.data.js et db/passages.data.js.
// Les livres sont rangés dans l'ordre d'une Bible catholique (Psaumes après Job : voir bibleOrder.js).
// Rejouable : on vide les tables avant de les remplir, dans une transaction.
// Usage : npm run seed

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { bibleGroups } from '../db/bible-groups.data.js';
import { epochs } from '../db/epochs.data.js';
import { passages } from '../db/passages.data.js';
import { validatePassages } from './passageRules.js';
import { validateEpochs } from './epochRules.js';
import { assignBookGroups } from './bibleGroupRules.js';
import { canonicalBookOrder, chaptersInReadingOrder, versesInReadingOrder } from './bibleOrder.js';
import { withClient, inTransaction } from './database.js';
import { placeholdersFor, verseKind } from './sqlRows.js';

const BATCH_SIZE = 1000;
const SOURCE_PATH = fileURLToPath(new URL('../data/bible.db', import.meta.url));

const source = readSource();
const books = canonicalBookOrder(source.books);
const chapters = chaptersInReadingOrder(books, source.verses);
const verses = versesInReadingOrder(books, source.verses);
// Une faute dans un fichier de données arrête le seed ICI, avant de toucher à la base
validatePassages(passages, source.verses);
validateEpochs(epochs, passages);
const groupOfBook = assignBookGroups(bibleGroups, books.map((book) => book.code));

// Soit tout est écrit, soit rien (une erreur au milieu annule tout)
await withClient((client) => inTransaction(client, async () => {
  await clearTables(client);
  const groupIds = await insertSlugList(client, 'bible_groups', bibleGroups);
  const bookIds = await insertBooks(client, books, groupOfBook, groupIds);
  await insertVerses(client, verses, bookIds);
  await insertChapters(client, chapters, bookIds);
  const epochIds = await insertSlugList(client, 'epochs', epochs);
  await insertPassages(client, passages, bookIds, epochIds);
}));

console.log(
  `Seed terminé : ${bibleGroups.length} ensembles, ${books.length} livres, ${chapters.length} chapitres, `
  + `${source.verses.length} versets, ${epochs.length} époques, ${passages.length} passages.`,
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

// Pas de CASCADE : si une autre table pointe un jour vers ces tables
// (ex. des surlignages), Postgres refusera au lieu d'effacer ces données.
async function clearTables(client) {
  await client.query('TRUNCATE passages, epochs, chapters, verses, books, bible_groups RESTART IDENTITY');
}

// Insère une liste des fichiers de données (slug, titre, pictogramme), dans l'ordre, une ligne à la fois
// (une dizaine au plus), et renvoie une Map : slug -> id. Sert aux grands ensembles et aux époques.
// table : 'bible_groups' ou 'epochs', écrit dans ce fichier (jamais une donnée venue de l'extérieur).
async function insertSlugList(client, table, items) {
  const ids = new Map();

  for (const [index, item] of items.entries()) {
    const result = await client.query(
      `INSERT INTO ${table} (slug, title, icon, position) VALUES ($1, $2, $3, $4) RETURNING id`,
      [item.slug, item.title, item.icon, index + 1],
    );
    ids.set(item.slug, result.rows[0].id);
  }

  return ids;
}

// Insère les livres (seulement 74, un par un) et renvoie une Map : code du livre -> id.
// groupOfBook : code du livre -> slug de son ensemble ; groupIds : slug de l'ensemble -> id
async function insertBooks(client, books, groupOfBook, groupIds) {
  const bookIds = new Map();

  for (const [index, book] of books.entries()) {
    const result = await client.query(
      'INSERT INTO books (code, title, position, group_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [book.code, book.title, index + 1, groupIds.get(groupOfBook.get(book.code))],
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

// Insère les passages dans l'ordre de la liste (déjà vérifiés par validatePassages et validateEpochs).
// Les id des versets de début et de fin sont retrouvés par la base elle-même (sous-requêtes) :
// $6 = le livre, $7/$8 = chapitre et verset de début, $9/$10 = chapitre et verset de fin.
async function insertPassages(client, passages, bookIds, epochIds) {
  for (const [index, passage] of passages.entries()) {
    await client.query(
      `INSERT INTO passages (position, slug, title, epoch_id, icon, start_verse_id, end_verse_id)
       VALUES ($1, $2, $3, $4, $5,
               (SELECT id FROM verses WHERE book_id = $6 AND chapter = $7 AND verse = $8),
               (SELECT id FROM verses WHERE book_id = $6 AND chapter = $9 AND verse = $10))`,
      [index + 1, passage.slug, passage.title, epochIds.get(passage.epoch), passage.icon,
        bookIds.get(passage.book), ...passage.start, ...passage.end],
    );
  }
}
