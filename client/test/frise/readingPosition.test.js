// Tests des calculs de la mesure de lecture (fonctions pures, sans page) :
// quel élément traverse la ligne de lecture, et quelle part de cet élément est déjà lue.

import { describe, test, expect } from 'vitest';
import { lastIndexAbove, progressThrough } from '../../src/frise/readingPosition.js';

// Le haut de 5 éléments à l'écran (px) : le 1er est déjà passé au-dessus de l'écran
const tops = [-900, -100, 250, 700, 1400];
const topOf = (index) => tops[index];

describe('lastIndexAbove', () => {
  test('le dernier élément dont le haut est au-dessus de la ligne : c\'est lui qu\'on lit', () => {
    expect(lastIndexAbove(tops.length, topOf, 300)).toBe(2);
    expect(lastIndexAbove(tops.length, topOf, 250)).toBe(2);
    expect(lastIndexAbove(tops.length, topOf, 2000)).toBe(4);
  });

  test('tout est encore sous la ligne : le premier élément', () => {
    expect(lastIndexAbove(tops.length, (index) => tops[index] + 5000, 300)).toBe(0);
  });

  test('un seul élément', () => {
    expect(lastIndexAbove(1, topOf, 300)).toBe(0);
  });
});

describe('progressThrough', () => {
  test('la part de l\'élément passée au-dessus de la ligne', () => {
    expect(progressThrough({ top: 0, height: 1000 }, 250)).toBe(0.25);
  });

  test('reste entre 0 (pas encore commencé) et presque 1 (jamais l\'élément suivant)', () => {
    expect(progressThrough({ top: 500, height: 1000 }, 250)).toBe(0);
    expect(progressThrough({ top: -2000, height: 1000 }, 250)).toBe(0.999);
  });

  test('arrondie au millième', () => {
    expect(progressThrough({ top: 0, height: 3 }, 1)).toBe(0.333);
  });
});
