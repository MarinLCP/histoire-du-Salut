// @vitest-environment jsdom
// Tests de la sauvegarde des surlignages. Le mécanisme commun (versions, erreurs, stockage bloqué)
// est testé dans storage/versionedStorage.test.js : ici, on vérifie ce qui est propre aux surlignages.

import { describe, test, expect, beforeEach } from 'vitest';
import { loadHighlights, saveHighlights } from '../../src/highlights/highlights.storage.js';

describe('sauvegarde des surlignages', () => {
  // Un stockage vide avant chaque test
  beforeEach(() => localStorage.clear());

  test('ce qui est sauvegardé est retrouvé au prochain chargement', () => {
    const highlights = new Map([['Gn 1,3', { createdAt: '2026-09-30T10:00:00.000Z' }]]);

    saveHighlights(highlights);

    expect(loadHighlights()).toEqual(highlights);
  });

  test('ils sont rangés sous la clé "highlights", au format version 1', () => {
    saveHighlights(new Map([['Gn 1,3', { createdAt: '2026-09-30T10:00:00.000Z' }]]));

    expect(JSON.parse(localStorage.getItem('highlights'))).toMatchObject({ version: 1 });
  });
});
