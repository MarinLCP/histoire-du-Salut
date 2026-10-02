// Tests des chemins dans l'arbre de la frise (fonctions pures).
// Un chemin = les rangs des nœuds, du haut vers le bas : [1, 0] = le 1er enfant du 2e nœud.

import { describe, test, expect } from 'vitest';
import { pathKey, startsWith, nodeAt } from '../../src/frise/nodePath.js';

const node = (title, children = []) => ({ title, children });
const roots = [node('A', [node('A0'), node('A1', [node('A1a')])]), node('B')];

describe('nodePath', () => {
  test('pathKey : une clé texte, unique pour chaque chemin', () => {
    expect([pathKey([]), pathKey([1]), pathKey([1, 0])]).toEqual(['', '1', '1.0']);
  });

  test('startsWith : le chemin commence-t-il par ce préfixe ?', () => {
    expect(startsWith([1, 0, 2], [1, 0])).toBe(true);
    expect(startsWith([1, 0], [])).toBe(true);
    expect(startsWith([1, 0], [0])).toBe(false);
    expect(startsWith([1], [1, 0])).toBe(false);
  });

  test('nodeAt : le nœud au bout du chemin (la racine imaginaire pour [])', () => {
    expect(nodeAt(roots, [0, 1, 0]).title).toBe('A1a');
    expect(nodeAt(roots, []).children).toBe(roots);
  });
});
