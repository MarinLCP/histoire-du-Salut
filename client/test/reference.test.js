// Tests unitaires des références bibliques (fonctions pures).

import { describe, test, expect } from 'vitest';
import { verseKey, passageReference } from '../src/bible/reference.js';

describe('verseKey', () => {
  test('construit la référence d\'un verset', () => {
    expect(verseKey('Gn', { chapter: '1', verse: '3' })).toBe('Gn 1,3');
  });

  test('garde les numéros avec lettre tels quels', () => {
    expect(verseKey('Ps', { chapter: '9A', verse: '1a' })).toBe('Ps 9A,1a');
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
