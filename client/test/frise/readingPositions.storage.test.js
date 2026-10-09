// @vitest-environment jsdom
// Tests de la position de lecture dans le navigateur : retenue avec sa date ; l'ancien marque-page qui suivait
// la lecture (versions 1 et 2) devient la position de lecture, sans rien perdre.

import { describe, test, expect, beforeEach } from 'vitest';
import { loadReadingPositions, saveReadingPosition } from '../../src/frise/readingPositions.storage.js';

const LONG_AGO = '1970-01-01T00:00:00.000Z';
const storedBookmarks = (version, bookmarks) => localStorage.setItem('bookmarks', JSON.stringify({ version, bookmarks }));

describe('readingPositions.storage', () => {
  beforeEach(() => localStorage.clear());

  test('retenir une position : avec sa date, sans toucher à l\'autre lecture', () => {
    saveReadingPosition('bible', 300);
    const saved = saveReadingPosition('history', 12.4);

    expect(loadReadingPositions().get('history')).toEqual(saved);
    expect(Date.parse(saved.savedAt)).not.toBeNaN();
    expect(loadReadingPositions().get('bible').position).toBe(300);
  });

  test('ancien format : le marque-page qui suivait la lecture devient la position ; un marque-page posé, non', () => {
    storedBookmarks(2, { history: { position: 12.4, verse: null }, bible: { position: 3, verse: 'Gn 1,3' } });

    expect([...loadReadingPositions()]).toEqual([['history', { position: 12.4, savedAt: LONG_AGO }]]);
  });

  test('très ancien format (une position seule) : relu aussi', () => {
    storedBookmarks(1, { bible: 300 });

    expect(loadReadingPositions().get('bible')).toEqual({ position: 300, savedAt: LONG_AGO });
  });
});
