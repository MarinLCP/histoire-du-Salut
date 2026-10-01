// @vitest-environment jsdom
// Tests de la sauvegarde des notes. Le mécanisme commun (versions, erreurs, stockage bloqué)
// est testé dans storage/versionedStorage.test.js : ici, on vérifie ce qui est propre aux notes.

import { describe, test, expect, beforeEach } from 'vitest';
import { loadNotes, saveNotes } from '../../src/notes/notes.storage.js';
import { loadHighlights } from '../../src/highlights/highlights.storage.js';

describe('sauvegarde des notes', () => {
  // Un stockage vide avant chaque test
  beforeEach(() => localStorage.clear());

  test('ce qui est sauvegardé est retrouvé au prochain chargement', () => {
    const notes = new Map([['Gn 1,3', { text: 'Une note', updatedAt: '2026-09-30T10:00:00.000Z' }]]);

    saveNotes(notes);

    expect(loadNotes()).toEqual(notes);
  });

  test('les notes et les surlignages sont sauvegardés séparément', () => {
    saveNotes(new Map([['Gn 1,3', { text: 'Une note', updatedAt: '2026-09-30T10:00:00.000Z' }]]));

    expect(loadHighlights().size).toBe(0);
  });
});
