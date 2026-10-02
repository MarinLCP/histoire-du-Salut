// Tests de l'index des versets de la source (fonction pure) : retrouver un verset par sa référence.

import { describe, test, expect } from 'vitest';
import { indexVerses, passageTexts } from '../../scripts/verseIndex.js';

describe('indexVerses', () => {
  test('la position d\'un verset dans l\'ordre de la source, par livre, chapitre et verset', () => {
    const index = indexVerses([{ code: 'Gn', chapter: '1', verse: '1' }, { code: 'Gn', chapter: '1', verse: '2' }]);

    expect(index.positionOf('Gn', '1', '2')).toBe(1);
    expect(index.positionOf('Gn', '1', '3')).toBeUndefined();
  });

  test('les livres présents dans la source', () => {
    const index = indexVerses([{ code: 'Gn', chapter: '1', verse: '1' }, { code: 'Ex', chapter: '1', verse: '1' }]);

    expect(index.hasBook('Ex')).toBe(true);
    expect(index.hasBook('Xx')).toBe(false);
  });
});

describe('passageTexts', () => {
  test('le texte de chaque passage : ses versets, du début à la fin (même sur plusieurs chapitres)', () => {
    const verses = [
      { code: 'Gn', chapter: '1', verse: '31', text: 'Et ce fut le soir.' },
      { code: 'Gn', chapter: '2', verse: '1', text: 'Ainsi furent achevés' },
      { code: 'Gn', chapter: '2', verse: '2', text: 'le ciel et la terre.' },
    ];
    const passages = [{ slug: 'fin', book: 'Gn', start: ['1', '31'], end: ['2', '1'] }];

    expect(passageTexts(passages, verses)).toEqual([{ slug: 'fin', book: 'Gn', text: 'Et ce fut le soir. Ainsi furent achevés' }]);
  });
});
