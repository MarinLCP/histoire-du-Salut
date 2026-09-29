// Remplit les tables books et verses à partir de data/bible.db (SQLite, AELF),
// puis la table passages à partir de db/passages.js.
// Rejouable : on vide les tables avant de les remplir, dans une transaction.
// Usage : npm run seed

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { passages } from '../db/passages.js';

const BATCH_SIZE = 1000;

// 1. Lecture de la source SQLite
const sourcePath = fileURLToPath(new URL('../data/bible.db', import.meta.url));
const source = new DatabaseSync(sourcePath, { readOnly: true });

// Dans la source, les rowid suivent l'ordre de lecture de la Bible.
// On ne peut pas utiliser la colonne book_id : chaque psaume y a le sien.
// L'ordre d'un livre = l'ordre de son premier verset.
const sourceBooks = source.prepare(`
  SELECT book AS code, book_title AS title
  FROM verses
  GROUP BY book
  ORDER BY MIN(rowid)
`).all();

const sourceVerses = source.prepare(`
  SELECT book AS code, chapter, verse, text
  FROM verses
  ORDER BY rowid
`).all();

source.close();

// 2. Écriture dans PostgreSQL
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  // Transaction : soit tout réussit, soit rien n'est enregistré
  await client.query('BEGIN');

  // Pas de CASCADE : si une autre table pointe un jour vers ces tables
  // (ex. des surlignages), Postgres refusera au lieu d'effacer ces données.
  await client.query('TRUNCATE passages, verses, books RESTART IDENTITY');

  // Les livres, un par un (seulement 74). On garde l'id de chaque code.
  const bookIds = new Map();
  for (const [index, book] of sourceBooks.entries()) {
    const result = await client.query(
      'INSERT INTO books (code, title, position) VALUES ($1, $2, $3) RETURNING id',
      [book.code, book.title, index + 1],
    );
    bookIds.set(book.code, result.rows[0].id);
  }

  // Les versets, par lots : une requête avec 1000 lignes est bien plus rapide
  // que 1000 requêtes d'une ligne.
  for (let start = 0; start < sourceVerses.length; start += BATCH_SIZE) {
    const batch = sourceVerses.slice(start, start + BATCH_SIZE);
    const values = [];
    const placeholders = [];

    batch.forEach((verse, i) => {
      const position = start + i + 1;
      // Quelques lignes de la source n'ont pas de numéro (ex. "ELLE" dans le Cantique)
      const kind = verse.verse === null ? 'unnumbered' : 'verse';
      const n = i * 6;
      // Pour chaque ligne : ($1, ..., $6), puis ($7, ..., $12), etc.
      placeholders.push(`($${n + 1}, $${n + 2}, $${n + 3}, $${n + 4}, $${n + 5}, $${n + 6})`);
      values.push(bookIds.get(verse.code), verse.chapter, verse.verse, kind, verse.text, position);
    });

    await client.query(
      `INSERT INTO verses (book_id, chapter, verse, kind, text, position) VALUES ${placeholders.join(', ')}`,
      values,
    );
  }

  // Les passages : on vérifie d'abord que leurs bornes existent vraiment
  for (const [index, passage] of passages.entries()) {
    const bookId = bookIds.get(passage.book);
    if (!bookId) {
      throw new Error(`Passage "${passage.title}" : livre ${passage.book} introuvable.`);
    }

    const [startChapter, startVerse] = passage.start.map(String);
    const [endChapter, endVerse] = passage.end.map(String);

    const startPosition = await findVersePosition(bookId, startChapter, startVerse);
    const endPosition = await findVersePosition(bookId, endChapter, endVerse);

    if (startPosition === null) {
      throw new Error(`Passage "${passage.title}" : ${passage.book} ${startChapter},${startVerse} introuvable.`);
    }
    if (endPosition === null) {
      throw new Error(`Passage "${passage.title}" : ${passage.book} ${endChapter},${endVerse} introuvable.`);
    }
    if (startPosition > endPosition) {
      throw new Error(`Passage "${passage.title}" : le début est après la fin.`);
    }

    await client.query(
      `INSERT INTO passages (position, title, book_id, start_chapter, start_verse, end_chapter, end_verse)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [index + 1, passage.title, bookId, startChapter, startVerse, endChapter, endVerse],
    );
  }

  await client.query('COMMIT');
  console.log(
    `Seed terminé : ${sourceBooks.length} livres, ${sourceVerses.length} versets, ${passages.length} passages.`,
  );
} catch (error) {
  // En cas d'erreur, on annule tout ce qui a été fait depuis BEGIN
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}

// Renvoie la position d'un verset, ou null s'il n'existe pas.
// (Déclaration de fonction : utilisable plus haut dans le fichier grâce au hoisting)
async function findVersePosition(bookId, chapter, verse) {
  const result = await client.query(
    'SELECT position FROM verses WHERE book_id = $1 AND chapter = $2 AND verse = $3',
    [bookId, chapter, verse],
  );
  return result.rows.length > 0 ? result.rows[0].position : null;
}
