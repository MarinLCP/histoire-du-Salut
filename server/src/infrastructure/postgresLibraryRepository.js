// Implémentation PostgreSQL du port LibraryRepository (domain/LibraryRepository.js) : notes, surlignages et
// marque-pages d'un compte (tables de la migration 011).

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/LibraryRepository.js').LibraryRepository}
 */
export function createPostgresLibraryRepository(pool) {
  return {
    // Trois requêtes en parallèle, remises au format du navigateur
    async load(userId) {
      const [notes, highlights, bookmarks] = await Promise.all([
        pool.query('SELECT verse_key, text, updated_at FROM user_notes WHERE user_id = $1', [userId]),
        pool.query('SELECT verse_key, created_at FROM user_highlights WHERE user_id = $1', [userId]),
        pool.query('SELECT mode, position FROM user_bookmarks WHERE user_id = $1', [userId]),
      ]);
      return {
        notes: Object.fromEntries(notes.rows.map((row) => [row.verse_key, { text: row.text, updatedAt: row.updated_at.toISOString() }])),
        highlights: Object.fromEntries(highlights.rows.map((row) => [row.verse_key, { createdAt: row.created_at.toISOString() }])),
        bookmarks: Object.fromEntries(bookmarks.rows.map((row) => [row.mode, row.position])),
      };
    },

    // Tout ou rien (transaction) ; unnest : chaque liste en UNE requête, quelle que soit sa taille
    async merge(userId, { notes, highlights, bookmarks }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(MERGE_NOTES, [userId, ...columns(notes, ['verseKey', 'text', 'updatedAt'])]);
        await client.query(MERGE_HIGHLIGHTS, [userId, ...columns(highlights, ['verseKey', 'createdAt'])]);
        await client.query(MERGE_BOOKMARKS, [userId, ...columns(bookmarks, ['mode', 'position'])]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
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

    async saveBookmark(userId, mode, position) {
      await pool.query(
        `INSERT INTO user_bookmarks (user_id, mode, position) VALUES ($1, $2, $3)
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
// Le marque-page du compte est gardé : il suit la lecture sur tous les appareils, c'est le plus à jour
const MERGE_BOOKMARKS = `
  INSERT INTO user_bookmarks (user_id, mode, position)
  SELECT $1, * FROM unnest($2::text[], $3::float8[])
  ON CONFLICT (user_id, mode) DO NOTHING
`;
