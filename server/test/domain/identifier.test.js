// Tests de la règle commune des identifiants (slugs, noms des pictogrammes) : fonction pure.

import { describe, test, expect } from 'vitest';
import { isIdentifier } from '../../src/domain/identifier.js';

describe('isIdentifier', () => {
  test.each(['creation', 'terre-promise', 'ps23', 'sun'])('"%s" est un identifiant', (value) => {
    expect(isIdentifier(value)).toBe(true);
  });

  test.each(['', 'La Création', 'terre--promise', '-chute', 'chute-', 'Gn', undefined, 12])('%s n\'en est pas un', (value) => {
    expect(isIdentifier(value)).toBe(false);
  });
});
