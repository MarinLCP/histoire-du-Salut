// Tests de la navigation dans la frise (fonctions pures) : où mène un clic, et les onglets.
// path : le chemin des nœuds dans lesquels on est entré ([] = vue d'ensemble).

import { describe, test, expect } from 'vitest';
import { pathAfterClick, pathOfTab, pressedTab } from '../../src/frise/cascadeNavigation.js';

const node = (children = []) => ({ title: 't', detail: null, icon: 'sun', position: 1, children });
// 2 époques → 2 épisodes chacune → 3 chapitres chacun
const roots = [node([node([node(), node(), node()]), node([node()])]), node([node([node()]), node([node()])])];

describe('pathAfterClick', () => {
  test('un bloc de l\'escalier qui a des enfants : on descend dedans', () => {
    expect(pathAfterClick(roots, { kind: 'stair', nodePath: [1] })).toEqual([1]);
    expect(pathAfterClick(roots, { kind: 'stair', nodePath: [1, 0] })).toEqual([1, 0]);
  });

  test('une bande : on remonte au niveau où ce nœud est dans l\'escalier', () => {
    expect(pathAfterClick(roots, { kind: 'strip', nodePath: [1] })).toEqual([]);
    expect(pathAfterClick(roots, { kind: 'strip', nodePath: [1, 0] })).toEqual([1]);
  });

  test('un bloc sans enfants (un chapitre) : on reste au même niveau', () => {
    expect(pathAfterClick(roots, { kind: 'stair', nodePath: [0, 0, 2] })).toBeNull();
  });
});

describe('onglets', () => {
  test('« Vue d\'ensemble » : tout en haut', () => {
    expect(pathOfTab(roots, [1, 0], 0)).toEqual([]);
  });

  test('2e onglet (Épisodes / Livres) : dans l\'époque en cours (la première si on est en haut)', () => {
    expect(pathOfTab(roots, [1, 0], 1)).toEqual([1]);
    expect(pathOfTab(roots, [], 1)).toEqual([0]);
  });

  test('« Chapitres » : le niveau le plus fin, autour de ce qu\'on regarde', () => {
    expect(pathOfTab(roots, [1], 2)).toEqual([1, 0]);
    expect(pathOfTab(roots, [], 2)).toEqual([0, 0]);
    expect(pathOfTab(roots, [0, 1], 2)).toEqual([0, 1]);
  });

  test('l\'onglet en surbrillance suit le niveau affiché', () => {
    expect([[], [1], [1, 0], [1, 0, 2]].map(pressedTab)).toEqual([0, 1, 2, 2]);
  });
});
