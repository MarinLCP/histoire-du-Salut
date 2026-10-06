// Tests du hachage des mots de passe (scrypt). Coût réduit pour aller vite : le principe est le même.

import { describe, test, expect } from 'vitest';
import { createScryptPasswordHasher } from '../../src/infrastructure/scryptPasswordHasher.js';
import { Password } from '../../src/domain/Password.js';

const hasher = createScryptPasswordHasher({ cost: 2 ** 10 });
const PASSWORD = new Password('un mot de passe long');

describe('scryptPasswordHasher', () => {
  test('l\'empreinte ne contient pas le mot de passe, et porte ses réglages', async () => {
    const passwordHash = await hasher.hash(PASSWORD);

    expect(passwordHash).not.toContain('un mot de passe long');
    expect(passwordHash.startsWith('scrypt$1024$8$1$')).toBe(true);
  });

  test('deux comptes avec le même mot de passe ont des empreintes différentes (sel aléatoire)', async () => {
    expect(await hasher.hash(PASSWORD)).not.toBe(await hasher.hash(PASSWORD));
  });

  test('reconnaît le bon mot de passe, refuse les autres', async () => {
    const passwordHash = await hasher.hash(PASSWORD);

    await expect(hasher.matches('un mot de passe long', passwordHash)).resolves.toBe(true);
    await expect(hasher.matches('un mot de passe lonG', passwordHash)).resolves.toBe(false);
  });

  test('compte inconnu (pas d\'empreinte) : non', async () => {
    await expect(hasher.matches('un mot de passe long', null)).resolves.toBe(false);
  });

  test('le coût par défaut (N = 2^15) fonctionne aussi', async () => {
    const strongHasher = createScryptPasswordHasher();

    await expect(strongHasher.matches('un mot de passe long', await strongHasher.hash(PASSWORD))).resolves.toBe(true);
  });
});
