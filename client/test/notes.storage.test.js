// Tests de la sauvegarde des notes. Le mécanisme commun (versions, erreurs, stockage bloqué)
// est déjà testé dans highlights.storage.test.js : ici, on vérifie juste que les notes en profitent.

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadNotes, saveNotes } from '../src/notes/notes.storage.js';
import { loadHighlights } from '../src/highlights/highlights.storage.js';

function createFakeStorage() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
  };
}

describe('sauvegarde des notes', () => {
  beforeEach(() => vi.stubGlobal('localStorage', createFakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

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
