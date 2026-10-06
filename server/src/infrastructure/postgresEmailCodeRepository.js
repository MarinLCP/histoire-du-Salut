// Implémentation PostgreSQL du port EmailCodeRepository (domain/AccountRepository.js) : les codes de validation
// envoyés par e-mail (migration 014). Le code (6 chiffres tirés au hasard) n'est rangé que haché ; 5 essais
// au plus : un code à 6 chiffres ne se devine pas en 5 essais (1 chance sur 200 000).

import { createHash, randomInt } from 'node:crypto';

const MAX_ATTEMPTS = 5;

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/AccountRepository.js').EmailCodeRepository}
 */
export function createPostgresEmailCodeRepository(pool) {
  return {
    async create(userId, minutes) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await pool.query(
        `INSERT INTO email_codes (user_id, code_hash, expires_at) VALUES ($1, $2, now() + make_interval(mins => $3))
         ON CONFLICT (user_id) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0`,
        [userId, fingerprint(userId, code), minutes],
      );
      return code;
    },

    // Un essai compte AVANT la comparaison (UPDATE ... RETURNING) : des essais simultanés ne dépassent pas la limite
    async check(userId, code) {
      const result = await pool.query(
        `UPDATE email_codes SET attempts = attempts + 1
         WHERE user_id = $1 AND expires_at > now() AND attempts < $2
         RETURNING code_hash`,
        [userId, MAX_ATTEMPTS],
      );
      const row = result.rows[0];
      if (!row) return 'expired';
      if (row.code_hash !== fingerprint(userId, code)) return 'wrong';
      await pool.query('DELETE FROM email_codes WHERE user_id = $1', [userId]);
      return 'valid';
    },
  };
}

// Le compte entre dans l'empreinte : le même code pour deux comptes ne donne pas la même empreinte
function fingerprint(userId, code) {
  return createHash('sha256').update(`${userId}:${code}`).digest('hex');
}
