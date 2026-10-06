// Implémentation PostgreSQL du port SharingRepository (domain/SharingRepository.js) : pseudo, lien de partage
// (migration 012) et progression (marque-pages du compte, migration 011, rapprochés des épisodes et chapitres).

import { randomBytes } from 'node:crypto';

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/SharingRepository.js').SharingRepository}
 */
export function createPostgresSharingRepository(pool) {
  return {
    async find(userId) {
      const result = await pool.query(
        `SELECT u.display_name AS "displayName", s.token
         FROM users u LEFT JOIN progress_shares s ON s.user_id = u.id
         WHERE u.id = $1`,
        [userId],
      );
      return result.rows[0];
    },

    async setDisplayName(userId, displayName) {
      await pool.query('UPDATE users SET display_name = $2 WHERE id = $1', [userId, displayName.value]);
    },

    // Un seul lien par lecteur : s'il existe déjà, c'est le même (ON CONFLICT : pas de doublon)
    async open(userId) {
      const result = await pool.query(
        `INSERT INTO progress_shares (user_id, token) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING token`,
        [userId, randomBytes(18).toString('base64url')],
      );
      return result.rows[0].token;
    },

    async close(userId) {
      await pool.query('DELETE FROM progress_shares WHERE user_id = $1', [userId]);
    },

    async findProgress(token) {
      const result = await pool.query(PROGRESS, [token]);
      const row = result.rows[0];
      if (!row) return null;
      return {
        displayName: row.display_name,
        history: row.episode === null ? null
          : { episode: row.episode, total: row.episode_total, slug: row.episode_slug, title: row.episode_title },
        bible: row.chapter === null ? null : { book: { code: row.book_code, title: row.book_title }, chapter: row.chapter },
      };
    },
  };
}

// Le marque-page de chaque lecture est une position continue (ex. 12.4 = dans l'épisode n° 12) :
// sa partie entière désigne l'épisode (passages.position) ou le chapitre (chapters.position).
// ::int : comparer deux entiers permet d'utiliser l'index de position
const PROGRESS = `
  SELECT u.display_name,
         p.position AS episode, p.slug AS episode_slug, p.title AS episode_title,
         (SELECT count(*)::int FROM passages) AS episode_total,
         c.label AS chapter, b.code AS book_code, b.title AS book_title
  FROM progress_shares s
  JOIN users u ON u.id = s.user_id
  LEFT JOIN user_bookmarks hb ON hb.user_id = u.id AND hb.mode = 'history'
  LEFT JOIN passages p ON p.position = floor(hb.position)::int
  LEFT JOIN user_bookmarks bb ON bb.user_id = u.id AND bb.mode = 'bible'
  LEFT JOIN chapters c ON c.position = floor(bb.position)::int
  LEFT JOIN books b ON b.id = c.book_id
  WHERE s.token = $1 AND u.display_name IS NOT NULL
`;
