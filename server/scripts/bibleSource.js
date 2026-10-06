// Lit la source des textes : data/bible.db (SQLite, AELF). Sert au seed et au rapport des parallèles.

import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const SOURCE_PATH = fileURLToPath(new URL('../data/bible.db', import.meta.url));

// Les livres et les versets de la source, dans son ordre.
export function readBibleSource() {
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
