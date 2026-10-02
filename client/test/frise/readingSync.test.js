// Tests du lien entre la lecture et la frise (fonctions pures).
// readingAt : la position de lecture continue. Ex. 12.4 = on a lu 40 % du passage n° 12 (ou du chapitre n° 12 de la Bible).

import { describe, test, expect } from 'vitest';
import { readingPath, currentStair, followReading } from '../../src/frise/readingSync.js';

// Un nœud de l'API : sa position est celle de son premier élément de lecture
const node = (position, children = []) => ({ title: 't', detail: null, icon: 'sun', position, children });

// Histoire : 2 époques ; épisodes (positions 1, 2, 3) ; les chapitres d'un épisode commencent à l'intérieur
// de lui (ex. 1.75 : le 2e chapitre commence à 75 % de l'épisode n° 1)
const history = [
  node(1, [node(1, [node(1), node(1.75)]), node(2, [node(2)])]),
  node(3, [node(3, [node(3), node(3.2), node(3.5)])]),
];

// Bible : un ensemble, deux livres ; des chapitres aux positions distinctes (1 à 5)
const bible = [node(1, [node(1, [node(1), node(2)]), node(3, [node(3), node(4), node(5)])])];

describe('readingPath : le nœud en cours de lecture, à chaque niveau', () => {
  test('Bible : l\'ensemble, le livre, puis le chapitre lu', () => {
    expect(readingPath(bible, 1.5)).toEqual([0, 0, 0]);
    expect(readingPath(bible, 4.2)).toEqual([0, 1, 1]);
  });

  test('histoire : l\'époque et l\'épisode lus', () => {
    expect(readingPath(history, 2.5).slice(0, 2)).toEqual([0, 1]);
    expect(readingPath(history, 3.1).slice(0, 2)).toEqual([1, 0]);
  });

  test('les chapitres d\'un épisode : chacun de sa position à celle du suivant (selon leur vraie longueur)', () => {
    expect(readingPath(history, 1.7)).toEqual([0, 0, 0]);
    expect(readingPath(history, 1.8)).toEqual([0, 0, 1]);
    expect(readingPath(history, 3.3)).toEqual([1, 0, 1]);
    expect(readingPath(history, 3.9)).toEqual([1, 0, 2]);
  });

  test('rien n\'est lu (pas encore de position, ou arbre pas encore chargé) : un chemin vide', () => {
    expect(readingPath(history, null)).toEqual([]);
    expect(readingPath([], 1)).toEqual([]);
  });
});

describe('currentStair : quel bloc de l\'escalier affiché est lu, et où on en est dedans (pour le bateau)', () => {
  test('vue d\'ensemble : l\'époque lue, et la part déjà lue de ses épisodes', () => {
    expect(currentStair(history, [], 1.5)).toEqual({ rank: 0, fraction: 0.25 });
    expect(currentStair(history, [], 3.5)).toEqual({ rank: 1, fraction: 0.5 });
  });

  test('dans une époque : l\'épisode lu, et la part lue de cet épisode', () => {
    expect(currentStair(history, [0], 2.25)).toEqual({ rank: 1, fraction: 0.25 });
  });

  test('on regarde une autre partie que celle qu\'on lit : pas de bloc en cours (pas de bateau)', () => {
    expect(currentStair(history, [1], 1.5)).toBeNull();
    expect(currentStair(history, [], null)).toBeNull();
  });
});

describe('followReading : la frise suit la lecture, au même niveau de zoom', () => {
  test('la lecture passe dans une autre époque : la frise y va aussi', () => {
    expect(followReading([0], [1, 0])).toEqual([1]);
    expect(followReading([0, 1], [1, 0, 2])).toEqual([1, 0]);
  });

  test('déjà au bon endroit, ou en vue d\'ensemble : rien ne bouge', () => {
    expect(followReading([1], [1, 0])).toBeNull();
    expect(followReading([], [1, 0])).toBeNull();
  });

  test('rien n\'est lu : rien ne bouge', () => {
    expect(followReading([1], [])).toBeNull();
  });
});
