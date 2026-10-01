// @vitest-environment jsdom
// Tests du mécanisme commun de sauvegarde (localStorage au format versionné),
// utilisé par les surlignages et les notes. Le localStorage est celui du faux navigateur jsdom.

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createVersionedStorage } from '../../src/storage/versionedStorage.js';

const storage = createVersionedStorage('exemple', 1);

describe('createVersionedStorage', () => {
  // Un stockage vide avant chaque test
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  test('sans rien de sauvegardé, la Map est vide', () => {
    expect(storage.load().size).toBe(0);
  });

  test('ce qui est sauvegardé est retrouvé au prochain chargement', () => {
    const entries = new Map([['Gn 1,3', { createdAt: '2026-09-30T10:00:00.000Z' }]]);

    storage.save(entries);

    expect(storage.load()).toEqual(entries);
  });

  test('le format sauvegardé porte un numéro de version', () => {
    storage.save(new Map([['Gn 1,3', { createdAt: '2026-09-30T10:00:00.000Z' }]]));

    expect(JSON.parse(localStorage.getItem('exemple'))).toEqual({
      version: 1,
      exemple: { 'Gn 1,3': { createdAt: '2026-09-30T10:00:00.000Z' } },
    });
  });

  test('des données illisibles ne font pas planter l\'app', () => {
    localStorage.setItem('exemple', '{ pas du JSON');

    expect(storage.load().size).toBe(0);
  });

  test('un format de version inconnue est ignoré', () => {
    localStorage.setItem('exemple', JSON.stringify({ version: 99, exemple: { 'Gn 1,3': {} } }));

    expect(storage.load().size).toBe(0);
  });

  test('un navigateur qui bloque le stockage ne fait pas planter l\'app', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('bloqué'); },
      setItem: () => { throw new Error('bloqué'); },
    });

    expect(() => storage.save(new Map())).not.toThrow();
    expect(storage.load().size).toBe(0);
  });
});
