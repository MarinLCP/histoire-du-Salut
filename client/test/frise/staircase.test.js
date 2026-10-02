// Tests du grand escalier de la frise (fonction pure : des rectangles, sans navigateur).
// La forme vient du dessin de Marin : chaque bloc descend jusqu'en bas, un peu plus large que le précédent,
// et ses enfants forment un petit escalier qui part de son haut et finit pile au début du bloc suivant.

import { describe, test, expect } from 'vitest';
import { staircase } from '../../src/frise/staircase.js';

const area = { left: 10, top: 20, width: 400, height: 600 };
const stairsOf = (options) => staircase({ ...area, minFirstWidth: 130, maxStairWidth: 70, stepsOf: () => 3, ...options });

const rightOf = (rect) => rect.left + rect.width;
const bottomOf = (rect) => rect.top + rect.height;

describe('staircase', () => {
  test('un bloc par élément, chacun une rangée plus bas, et tous descendent jusqu\'en bas (rien ne flotte)', () => {
    const stairs = stairsOf({ count: 4 });

    expect(stairs).toHaveLength(4);
    expect(stairs.map((stair) => stair.rect.top)).toEqual([20, 170, 320, 470]);
    stairs.forEach((stair) => expect(bottomOf(stair.rect)).toBe(620));
  });

  test('chaque bloc est plus large que le précédent d\'une marche, et le dernier escalier va jusqu\'au bord', () => {
    const stairs = stairsOf({ count: 4 });
    const rights = stairs.map((stair) => rightOf(stair.rect));

    expect(rightOf(stairs.at(-1).steps.at(-1))).toBe(410);
    expect(rights[1] - rights[0]).toBe(rights[2] - rights[1]);
    stairs.forEach((stair) => expect(stair.rect.left).toBe(10));
  });

  test('la marche est plafonnée : dans une grande zone, le premier bloc prend la place en trop', () => {
    const [first, second] = stairsOf({ count: 2 });

    expect(rightOf(second.rect) - rightOf(first.rect)).toBe(70);
    expect(first.rect.width).toBe(400 - 2 * 70);
  });

  test('le premier bloc garde une largeur minimale, même avec beaucoup d\'éléments', () => {
    const [first] = stairsOf({ count: 40 });

    expect(first.rect.width).toBeGreaterThanOrEqual(130);
  });

  test('le petit escalier part du haut du bloc et finit pile au début du bloc suivant', () => {
    const [first, second] = stairsOf({ count: 4 });

    expect(first.steps).toHaveLength(3);
    expect(first.steps[0].top).toBe(first.rect.top);
    expect(first.steps[0].left).toBe(rightOf(first.rect));
    expect(rightOf(first.steps.at(-1))).toBe(rightOf(second.rect));
    first.steps.forEach((step) => expect(bottomOf(step)).toBe(620));
  });

  test('les marches descendent et s\'élargissent, sans sortir de la rangée de leur bloc', () => {
    const [first] = stairsOf({ count: 4 });
    const tops = first.steps.map((step) => step.top);
    const widths = first.steps.map((step) => step.width);

    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    expect(widths).toEqual([...widths].sort((a, b) => a - b));
    expect(tops.at(-1)).toBeLessThan(first.rect.top + first.rowHeight);
  });

  test('arrondi seulement en bout de surface : un bloc sans marches est arrondi, les autres non', () => {
    const stairs = stairsOf({ count: 2, stepsOf: (rank) => (rank === 0 ? 2 : 0) });

    expect(stairs.map((stair) => stair.radius)).toEqual([0, 16]);
  });

  test('aucun élément : aucun bloc', () => {
    expect(stairsOf({ count: 0 })).toEqual([]);
  });
});
