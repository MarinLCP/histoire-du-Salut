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

  test('parse : relit une référence écrite ("Ps 9A,1a"), l\'inverse de toString', () => {
    expect(VerseReference.parse('Ps 9A,1a')).toEqual({ book: 'Ps', chapter: '9A', verse: '1a' });
    expect(String(VerseReference.parse('1S 17,4'))).toBe('1S 17,4');
  });

  test.each(['Gn 1', 'Gn1,3', 'Gn 1,', '', 42, `Gn 1,${'1'.repeat(40)}`])('parse : %j illisible, ValidationError', (text) => {
    expect(() => VerseReference.parse(text)).toThrow('illisible');
  });
});
