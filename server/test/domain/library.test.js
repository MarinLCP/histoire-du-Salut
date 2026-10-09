// Tests unitaires des règles de la bibliothèque d'un lecteur (notes, surlignages, marque-pages).

import { describe, test, expect } from 'vitest';
import { verseKey, noteText, readingMode, readingPosition, readingBookmark, libraryFrom } from '../../src/domain/library.js';

describe('règles de la bibliothèque', () => {
  test('verseKey : une référence lisible, réécrite comme le site l\'écrit', () => {
    expect(verseKey('Ps 9A,1a')).toBe('Ps 9A,1a');
    expect(() => verseKey('n\'importe quoi')).toThrow('illisible');
  });

  test('noteText : non vide, 10 000 caractères au plus', () => {
    expect(noteText('Une parole')).toBe('Une parole');
    expect(() => noteText('   ')).toThrow('entre 1 et 10000');
    expect(() => noteText('a'.repeat(10001))).toThrow('entre 1 et 10000');
  });

  test('readingMode et readingPosition', () => {
    expect(readingMode('bible')).toBe('bible');
    expect(() => readingMode('autre')).toThrow('inconnue');
    expect(readingPosition(12.4)).toBe(12.4);
    expect(() => readingPosition(-1)).toThrow('invalide');
    expect(() => readingPosition('12')).toThrow('invalide');
  });

  test('readingBookmark : posé à la main, sur un verset', () => {
    expect(readingBookmark({ position: 4.2, verse: 'Gn 1,3' })).toEqual({ position: 4.2, verse: 'Gn 1,3' });
    expect(() => readingBookmark({ position: 4.2 })).toThrow();
    expect(() => readingBookmark({ position: 4.2, verse: 'n\'importe quoi' })).toThrow();
    expect(() => readingBookmark({ verse: 'Gn 1,3' })).toThrow('invalide');
  });

  test('libraryFrom : le format du navigateur, vérifié et mis à plat', () => {
    const library = libraryFrom({
      notes: { 'Gn 1,3': { text: 'La lumière', updatedAt: '2026-10-06T10:00:00.000Z' } },
      highlights: { 'Jn 3,16': { createdAt: '2026-10-05T10:00:00.000Z' } },
      bookmarks: { bible: { position: 3.5, verse: 'Jn 3,16' } },
      readings: { history: { position: 12.4, savedAt: '2026-10-09T08:00:00.000Z' } },
    });

    expect(library).toEqual({
      notes: [{ verseKey: 'Gn 1,3', text: 'La lumière', updatedAt: '2026-10-06T10:00:00.000Z' }],
      highlights: [{ verseKey: 'Jn 3,16', createdAt: '2026-10-05T10:00:00.000Z' }],
      bookmarks: [{ mode: 'bible', position: 3.5, verse: 'Jn 3,16' }],
      readings: [{ mode: 'history', position: 12.4, savedAt: '2026-10-09T08:00:00.000Z' }],
    });
  });

  test('libraryFrom : un marque-page sans verset (ancienne version de l\'app, il suivait la lecture) est ignoré', () => {
    expect(libraryFrom({ bookmarks: { history: 12.4, bible: { position: 3, verse: null } } }).bookmarks).toEqual([]);
  });

  test('libraryFrom : vide si rien n\'est envoyé ; une seule valeur fausse refuse tout', () => {
    expect(libraryFrom({})).toEqual({ notes: [], highlights: [], bookmarks: [], readings: [] });
    expect(() => libraryFrom({ readings: { history: { position: 2 } } })).toThrow('Date invalide.');
    expect(() => libraryFrom({ notes: { 'Gn 1,3': { text: 'ok', updatedAt: 'hier' } } })).toThrow('Date invalide.');
    expect(() => libraryFrom({ highlights: ['Gn 1,3'] })).toThrow('Format de bibliothèque invalide.');
  });
});
