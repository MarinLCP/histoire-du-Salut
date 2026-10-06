// Tests unitaires du value object Password : la règle d'un mot de passe acceptable (domaine pur).

import { describe, test, expect } from 'vitest';
import { Password } from '../../src/domain/Password.js';
import { ValidationError } from '../../src/domain/errors.js';

describe('Password', () => {
  test('accepte un mot de passe de 10 caractères ou plus, tel quel (espaces compris)', () => {
    expect(new Password(' dix lettres ').value).toBe(' dix lettres ');
  });

  test.each(['', 'court', '123456789', undefined, 1234567890])('refuse %j : 10 caractères au moins', (text) => {
    expect(() => new Password(text)).toThrow(ValidationError);
  });

  test('refuse plus de 128 caractères (le hachage d\'un texte énorme coûterait cher au serveur)', () => {
    expect(() => new Password('a'.repeat(129))).toThrow('entre 10 et 128 caractères');
  });

  test('ne s\'affiche jamais par erreur (ex. dans un message ou un journal)', () => {
    expect(String(new Password('mon-secret-123'))).toBe('[mot de passe]');
    expect(JSON.stringify({ password: new Password('mon-secret-123') })).toBe('{"password":"[mot de passe]"}');
  });
});
