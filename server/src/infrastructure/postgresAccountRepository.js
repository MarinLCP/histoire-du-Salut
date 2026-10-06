// Implémentations PostgreSQL des ports UserRepository et SessionRepository (domain/AccountRepository.js).
// Le jeton de session est un secret aléatoire (32 octets) donné au navigateur ; la base n'en garde que
// l'empreinte SHA-256 : avec une copie de la base, on ne peut pas ouvrir de session.

import { createHash, randomBytes } from 'node:crypto';

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/AccountRepository.js').UserRepository}
 */
export function createPostgresUserRepository(pool) {
  return {
    async create(email, passwordHash) {
      // ON CONFLICT DO NOTHING : e-mail déjà pris = aucune ligne renvoyée (même si deux inscriptions arrivent ensemble)
      const result = await pool.query(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, email`,
        [email.value, passwordHash],
      );
      return result.rows[0] ?? null;
    },

    async findByEmail(email) {
      const result = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [email.value]);
      return result.rows[0] ?? null;
    },

    async findById(id) {
      const result = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
      return result.rows[0] ?? null;
    },

    // Sessions, notes, surlignages, marque-pages et lien de partage disparaissent avec le compte : ON DELETE CASCADE
    async delete(id) {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
    },
  };
}

const USER_COLUMNS = 'id, email, password_hash AS "passwordHash"';

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/AccountRepository.js').SessionRepository}
 */
export function createPostgresSessionRepository(pool) {
  return {
    async open(userId, days) {
      const token = randomBytes(32).toString('base64url');
      // Au passage, on range : les sessions expirées de ce lecteur ne servent plus
      await pool.query('DELETE FROM sessions WHERE user_id = $1 AND expires_at <= now()', [userId]);
      await pool.query(
        `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`,
        [fingerprint(token), userId, days],
      );
      return token;
    },

    async findUser(token) {
      const result = await pool.query(
        `SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1 AND s.expires_at > now()`,
        [fingerprint(token)],
      );
      return result.rows[0] ?? null;
    },

    async close(token) {
      await pool.query('DELETE FROM sessions WHERE token_hash = $1', [fingerprint(token)]);
    },
  };
}

function fingerprint(token) {
  return createHash('sha256').update(token).digest('hex');
}
