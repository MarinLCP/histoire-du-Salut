// Tests unitaires des références bibliques (fonctions pures).

import { describe, test, expect } from 'vitest';
import { verseKey, parseVerseKey, rangeReference, passageReference } from '../../src/bible/reference.js';

describe('verseKey', () => {
  test('construit la référence d\'un verset', () => {
    expect(verseKey('Gn', { chapter: '1', verse: '3' })).toBe('Gn 1,3');
  });

  test('garde les numéros avec lettre tels quels', () => {
    expect(verseKey('Ps', { chapter: '9A', verse: '1a' })).toBe('Ps 9A,1a');
  });
});

describe('parseVerseKey', () => {
  test('relit le livre, le chapitre et le verset d\'une référence', () => {
    expect(parseVerseKey('Ps 9A,1a')).toEqual({ book: 'Ps', chapter: '9A', verse: '1a' });
    expect(parseVerseKey('1S 17,4')).toEqual({ book: '1S', chapter: '17', verse: '4' });
  });

  test('une référence mal formée : null', () => {
    expect(parseVerseKey('Gn 1')).toBeNull();
  });
});

describe('rangeReference', () => {
  const at = (book, chapter, verse) => ({ book, chapter, verse });

  test.each([
    ['un verset', at('Ml', '3', '23'), at('Ml', '3', '23'), 'Ml 3,23'],
    ['une plage dans un chapitre', at('Mc', '9', '11'), at('Mc', '9', '13'), 'Mc 9,11-13'],
    ['sur deux chapitres', at('Gn', '31', '55'), at('Gn', '32', '2'), 'Gn 31,55 – 32,2'],
    ['d\'un livre au suivant', at('2Ch', '36', '22'), at('Esd', '1', '3'), '2Ch 36,22 – Esd 1,3'],
  ])('%s', (_, start, end, expected) => {
    expect(rangeReference(start, end)).toBe(expected);
  });
});

describe('passageReference', () => {
  const book = { code: 'Gn', title: 'La Genèse' };

  test('dans un seul chapitre : "La Genèse 12, 1-9"', () => {
    const passage = { book, start: { chapter: '12', verse: '1' }, end: { chapter: '12', verse: '9' } };

    expect(passageReference(passage)).toBe('La Genèse 12, 1-9');
  });

  test('sur deux chapitres : "La Genèse 1, 1 – 2, 25"', () => {
    const passage = { book, start: { chapter: '1', verse: '1' }, end: { chapter: '2', verse: '25' } };

    expect(passageReference(passage)).toBe('La Genèse 1, 1 – 2, 25');
  });
});
