// Tests des petites règles d'écriture du seed (fonctions pures, sans base).

import { describe, test, expect } from 'vitest';
import { placeholdersFor, verseKind } from '../../scripts/sqlRows.js';

describe('placeholdersFor', () => {
  test('numérote les paramètres ligne après ligne : 2 lignes de 3 colonnes', () => {
    expect(placeholdersFor([['a', 'b', 'c'], ['d', 'e', 'f']])).toBe('($1, $2, $3), ($4, $5, $6)');
  });

  test('une seule ligne d\'une colonne', () => {
    expect(placeholdersFor([['a']])).toBe('($1)');
  });
});

describe('verseKind', () => {
  test('un verset numéroté, ou une ligne sans numéro (ex. « ELLE » dans le Cantique)', () => {
    expect(verseKind({ verse: '1' })).toBe('verse');
    expect(verseKind({ verse: null })).toBe('unnumbered');
  });
});
