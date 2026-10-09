// Implémentation PostgreSQL du port LibraryRepository (domain/LibraryRepository.js) : notes, surlignages,
// marque-pages (tables de la migration 011) et positions de lecture (migration 017) d'un compte.

import { inTransaction } from './transaction.js';

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/LibraryRepository.js').LibraryRepository}
 */
export function createPostgresLibraryRepository(pool) {
  return {
    // Quatre requêtes en parallèle, remises au format du navigateur
    async load(userId) {
      const [notes, highlights, bookmarks, readings] = await Promise.all([
        pool.query('SELECT verse_key, text, updated_at FROM user_notes WHERE user_id = $1', [userId]),
        pool.query('SELECT verse_key, created_at FROM user_highlights WHERE user_id = $1', [userId]),
        pool.query('SELECT mode, position, verse_key FROM user_bookmarks WHERE user_id = $1', [userId]),
        pool.query('SELECT mode, position, updated_at FROM user_reading_positions WHERE user_id = $1', [userId]),
      ]);
      return {
        notes: Object.fromEntries(notes.rows.map((row) => [row.verse_key, { text: row.text, updatedAt: row.updated_at.toISOString() }])),
        highlights: Object.fromEntries(highlights.rows.map((row) => [row.verse_key, { createdAt: row.created_at.toISOString() }])),
        bookmarks: Object.fromEntries(bookmarks.rows.map((row) => [row.mode, { position: row.position, verse: row.verse_key }])),
        readings: Object.fromEntries(readings.rows.map((row) => [row.mode, { position: row.position, savedAt: row.updated_at.toISOString() }])),
      };
    },

    // Tout ou rien (transaction) ; unnest : chaque liste en UNE requête, quelle que soit sa taille
    async merge(userId, { notes, highlights, bookmarks, readings }) {
      const client = await pool.connect();
      try {
        await inTransaction(client, async () => {
          await client.query(MERGE_NOTES, [userId, ...columns(notes, ['verseKey', 'text', 'updatedAt'])]);
          await client.query(MERGE_HIGHLIGHTS, [userId, ...columns(highlights, ['verseKey', 'createdAt'])]);
          await client.query(MERGE_BOOKMARKS, [userId, ...columns(bookmarks, ['mode', 'position', 'verse'])]);
          await client.query(MERGE_READINGS, [userId, ...columns(readings, ['mode', 'position', 'savedAt'])]);
        });
      } finally {
        client.release();
      }
    },

    async saveNote(userId, verseKey, text) {
      await pool.query(
        `INSERT INTO user_notes (user_id, verse_key, text, updated_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (user_id, verse_key) DO UPDATE SET text = EXCLUDED.text, updated_at = EXCLUDED.updated_at`,
        [userId, verseKey, text],
      );
    },

    async deleteNote(userId, verseKey) {
      await pool.query('DELETE FROM user_notes WHERE user_id = $1 AND verse_key = $2', [userId, verseKey]);
    },

    async addHighlight(userId, verseKey) {
      await pool.query(
        `INSERT INTO user_highlights (user_id, verse_key, created_at) VALUES ($1, $2, now())
         ON CONFLICT (user_id, verse_key) DO NOTHING`,
        [userId, verseKey],
      );
    },

    async removeHighlight(userId, verseKey) {
      await pool.query('DELETE FROM user_highlights WHERE user_id = $1 AND verse_key = $2', [userId, verseKey]);
    },

    async saveBookmark(userId, mode, { position, verse }) {
      await pool.query(
        `INSERT INTO user_bookmarks (user_id, mode, position, verse_key) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, mode) DO UPDATE
           SET position = EXCLUDED.position, verse_key = EXCLUDED.verse_key, updated_at = now()`,
        [userId, mode, position, verse],
      );
    },

    async removeBookmark(userId, mode) {
      await pool.query('DELETE FROM user_bookmarks WHERE user_id = $1 AND mode = $2', [userId, mode]);
    },

    async saveReading(userId, mode, position) {
      await pool.query(
        `INSERT INTO user_reading_positions (user_id, mode, position) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, mode) DO UPDATE SET position = EXCLUDED.position, updated_at = now()`,
        [userId, mode, position],
      );
    },
  };
}

// [{ a: 1, b: 2 }, { a: 3, b: 4 }] et ['a', 'b'] -> [[1, 3], [2, 4]] : une liste par colonne (pour unnest)
function columns(rows, names) {
  return names.map((name) => rows.map((row) => row[name]));
}

// Une note du navigateur ne remplace celle du compte que si elle est plus récente
const MERGE_NOTES = `
  INSERT INTO user_notes (user_id, verse_key, text, updated_at)
  SELECT $1, * FROM unnest($2::text[], $3::text[], $4::timestamptz[])
  ON CONFLICT (user_id, verse_key) DO UPDATE SET text = EXCLUDED.text, updated_at = EXCLUDED.updated_at
  WHERE user_notes.updated_at < EXCLUDED.updated_at
`;
const MERGE_HIGHLIGHTS = `
  INSERT INTO user_highlights (user_id, verse_key, created_at)
  SELECT $1, * FROM unnest($2::text[], $3::timestamptz[])
  ON CONFLICT (user_id, verse_key) DO NOTHING
`;
// Le marque-page déjà posé dans le compte est gardé
const MERGE_BOOKMARKS = `
  INSERT INTO user_bookmarks (user_id, mode, position, verse_key)
  SELECT $1, * FROM unnest($2::text[], $3::float8[], $4::text[])
  ON CONFLICT (user_id, mode) DO NOTHING
`;
// Où on en est : la position la plus récente gagne (le navigateur, ou un autre appareil passé par le compte)
const MERGE_READINGS = `
  INSERT INTO user_reading_positions (user_id, mode, position, updated_at)
  SELECT $1, * FROM unnest($2::text[], $3::float8[], $4::timestamptz[])
  ON CONFLICT (user_id, mode) DO UPDATE SET position = EXCLUDED.position, updated_at = EXCLUDED.updated_at
  WHERE user_reading_positions.updated_at < EXCLUDED.updated_at
`;
