// Tests du value object VerseReference : la référence d'un verset (livre, chapitre, verset).

import { describe, test, expect } from 'vitest';
import { VerseReference } from '../../src/domain/VerseReference.js';

describe('VerseReference', () => {
  test('s\'écrit comme dans le site : "Gn 32,2"', () => {
    expect(String(new VerseReference('Gn', '32', '2'))).toBe('Gn 32,2');
  });

  test('from : chapitre et verset en texte, même donnés en nombres (la base les range en texte : "9A", "1a")', () => {
    const reference = VerseReference.from({ book: 'Ml', chapter: 3, verse: 23 });

    expect(reference).toEqual({ book: 'Ml', chapter: '3', verse: '23' });
  });

  test('immuable', () => {
    const reference = new VerseReference('Gn', '1', '1');

    expect(Object.isFrozen(reference)).toBe(true);
  });

  test.each([['', '1', '1'], ['Gn', '', '1'], ['Gn', '1', '']])('une partie vide (%j, %j, %j) : ValidationError', (book, chapter, verse) => {
    expect(() => new VerseReference(book, chapter, verse)).toThrow('Référence de verset incomplète.');
  });
});
