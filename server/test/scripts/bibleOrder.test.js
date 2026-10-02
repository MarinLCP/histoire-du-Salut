// Tests des règles d'ordre de la Bible (fonctions pures, sans base) : l'ordre des livres,
// et la liste des chapitres dans l'ordre de lecture.

import { describe, test, expect } from 'vitest';
import { canonicalBookOrder, chaptersInReadingOrder, versesInReadingOrder } from '../../scripts/bibleOrder.js';

const codes = (books) => books.map((book) => book.code);

describe('canonicalBookOrder', () => {
  test('remet les Psaumes juste après Job (la source les range après l\'Apocalypse)', () => {
    const source = ['Gn', 'Jb', 'Pr', 'Ap', 'Ps'].map((code) => ({ code }));

    expect(codes(canonicalBookOrder(source))).toEqual(['Gn', 'Jb', 'Ps', 'Pr', 'Ap']);
  });

  test('ne change rien si les Psaumes sont déjà à leur place', () => {
    const source = ['Jb', 'Ps', 'Pr'].map((code) => ({ code }));

    expect(codes(canonicalBookOrder(source))).toEqual(['Jb', 'Ps', 'Pr']);
  });

  test('ne modifie pas la liste reçue', () => {
    const source = ['Jb', 'Ap', 'Ps'].map((code) => ({ code }));

    canonicalBookOrder(source);

    expect(codes(source)).toEqual(['Jb', 'Ap', 'Ps']);
  });
});

describe('chaptersInReadingOrder', () => {
  test('les chapitres de chaque livre, dans l\'ordre des livres puis de leurs versets', () => {
    const books = [{ code: 'Jb' }, { code: 'Ps' }];
    const verses = [
      { code: 'Ps', chapter: '9A' }, { code: 'Ps', chapter: '9A' }, { code: 'Ps', chapter: '9B' },
      { code: 'Jb', chapter: '1' }, { code: 'Jb', chapter: '2' },
    ];

    expect(chaptersInReadingOrder(books, verses)).toEqual([
      { code: 'Jb', label: '1' },
      { code: 'Jb', label: '2' },
      { code: 'Ps', label: '9A' },
      { code: 'Ps', label: '9B' },
    ]);
  });
});

describe('versesInReadingOrder', () => {
  test('les versets suivent l\'ordre des livres donné (Psaumes après Job), sans changer l\'ordre dans un livre', () => {
    const books = ['Jb', 'Ps', 'Ap'].map((code) => ({ code }));
    const verses = [
      { code: 'Jb', chapter: '42', verse: '17' }, { code: 'Ap', chapter: '22', verse: '21' },
      { code: 'Ps', chapter: '1', verse: '1' }, { code: 'Ps', chapter: '1', verse: '2' },
    ];

    expect(versesInReadingOrder(books, verses).map((verse) => `${verse.code} ${verse.chapter},${verse.verse}`))
      .toEqual(['Jb 42,17', 'Ps 1,1', 'Ps 1,2', 'Ap 22,21']);
  });
});
