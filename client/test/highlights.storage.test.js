// Tests de la sauvegarde des surlignages dans le navigateur.
// Les tests tournent dans Node, sans navigateur : on remplace localStorage par un faux, en mémoire.

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadHighlights, saveHighlights } from '../src/highlights/highlights.storage.js';

function createFakeStorage() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
  };
}

describe('sauvegarde des surlignages', () => {
  beforeEach(() => vi.stubGlobal('localStorage', createFakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  test('sans rien de sauvegardé, il n\'y a aucun surlignage', () => {
    expect(loadHighlights().size).toBe(0);
  });

  test('ce qui est sauvegardé est retrouvé au prochain chargement', () => {
    const highlights = new Map([['Gn 1,3', { createdAt: '2026-09-30T10:00:00.000Z' }]]);

    saveHighlights(highlights);

    expect(loadHighlights()).toEqual(highlights);
  });

  test('le format sauvegardé porte un numéro de version', () => {
    saveHighlights(new Map([['Gn 1,3', { createdAt: '2026-09-30T10:00:00.000Z' }]]));

    const stored = JSON.parse(localStorage.getItem('highlights'));

    expect(stored).toEqual({
      version: 1,
      highlights: { 'Gn 1,3': { createdAt: '2026-09-30T10:00:00.000Z' } },
    });
  });

  test('des données illisibles ne font pas planter l\'app', () => {
    localStorage.setItem('highlights', '{ pas du JSON');

    expect(loadHighlights().size).toBe(0);
  });

  test('un format de version inconnue est ignoré', () => {
    localStorage.setItem('highlights', JSON.stringify({ version: 99, highlights: { 'Gn 1,3': {} } }));

    expect(loadHighlights().size).toBe(0);
  });

  test('un navigateur qui bloque le stockage ne fait pas planter l\'app', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('bloqué'); },
      setItem: () => { throw new Error('bloqué'); },
    });

    expect(() => saveHighlights(new Map())).not.toThrow();
    expect(loadHighlights().size).toBe(0);
  });
});
