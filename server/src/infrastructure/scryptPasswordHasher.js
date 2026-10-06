// Implémentation du port PasswordHasher (domain/AccountRepository.js) avec scrypt, inclus dans Node :
// aucune dépendance. scrypt est volontairement lent et gourmand en mémoire : deviner un mot de passe
// à partir d'une base volée coûterait très cher. Chaque mot de passe a son propre sel (aléatoire).
// Format rangé en base : "scrypt$N$r$p$sel$empreinte" (sel et empreinte en base64) : les réglages voyagent
// avec l'empreinte, on peut donc les renforcer plus tard sans casser les anciens comptes.

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

// Coût N = 2^15 (32 Mo de mémoire par calcul) : recommandation OWASP pour scrypt
const DEFAULT_COST = 2 ** 15;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

// Pour un compte inconnu : un calcul « pour rien », pour répondre en autant de temps qu'avec un vrai compte
const DECOY_SALT = Buffer.alloc(SALT_LENGTH);

/**
 * @param {{ cost?: number }} [options] - cost : N de scrypt (les tests en prennent un petit, plus rapide)
 * @returns {import('../domain/AccountRepository.js').PasswordHasher}
 */
export function createScryptPasswordHasher({ cost = DEFAULT_COST } = {}) {
  return {
    async hash(password) {
      const salt = randomBytes(SALT_LENGTH);
      const key = await derive(password.value, salt, cost, BLOCK_SIZE, PARALLELISM);
      return ['scrypt', cost, BLOCK_SIZE, PARALLELISM, salt.toString('base64'), key.toString('base64')].join('$');
    },

    async matches(password, passwordHash) {
      if (!passwordHash) {
        await derive(password, DECOY_SALT, cost, BLOCK_SIZE, PARALLELISM);
        return false;
      }
      const [, n, r, p, salt, expected] = passwordHash.split('$');
      const key = await derive(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p));
      // timingSafeEqual : la comparaison prend le même temps, que les octets diffèrent au début ou à la fin
      return timingSafeEqual(key, Buffer.from(expected, 'base64'));
    },
  };
}

function derive(password, salt, cost, blockSize, parallelism) {
  // maxmem : scrypt refuse par défaut d'utiliser plus de 32 Mo ; N = 2^15 en demande un peu plus
  return scryptAsync(password, salt, KEY_LENGTH, { N: cost, r: blockSize, p: parallelism, maxmem: 128 * cost * blockSize * 2 });
}
