// Tests de la disposition de la frise en vue d'ensemble (fonction pure) : quels blocs, où, et lesquels ont un titre.

import { describe, test, expect } from 'vitest';
import { layoutOverview, MAX_STEPS } from '../../src/frise/cascadeLayout.js';

// Un nœud de l'API (forme commune à tous les niveaux) avec `childCount` enfants
const node = (title, childCount = 0) => ({
  title, detail: null, icon: 'sun', position: 1,
  children: Array.from({ length: childCount }, (_, index) => node(`${title} ${index + 1}`)),
});

const box = { width: 400, height: 600 };
const roots = [node('Les origines', 3), node('Les patriarches', 5)];

describe('layoutOverview', () => {
  test('un bloc avec titre par époque, et un petit bloc sans titre par épisode', () => {
    const blocks = layoutOverview(roots, box);
    const labelled = blocks.filter((block) => block.labelled);

    expect(labelled.map((block) => block.node.title)).toEqual(['Les origines', 'Les patriarches']);
    expect(blocks).toHaveLength(2 + 3 + 5);
    expect(labelled.map((block) => block.depth)).toEqual([1, 1]);
    expect(blocks.filter((block) => !block.labelled).every((block) => block.depth === 2)).toBe(true);
  });

  test('chaque bloc a une clé stable : son chemin dans l\'arbre', () => {
    const keys = layoutOverview(roots, box).map((block) => block.key);

    expect(keys.slice(0, 4)).toEqual(['0', '0.0', '0.1', '0.2']);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('chaque bloc passe au-dessus du précédent, et ses marches au-dessus de lui', () => {
    const [origins, ...rest] = layoutOverview(roots, box);
    const originsSteps = rest.filter((block) => block.key.startsWith('0.'));
    const patriarchs = rest.find((block) => block.key === '1');

    originsSteps.forEach((step) => {
      expect(step.z).toBeGreaterThan(origins.z);
      expect(step.z).toBeLessThan(patriarchs.z);
    });
  });

  test(`au plus ${MAX_STEPS} marches par bloc : au-delà, l'escalier serait illisible`, () => {
    const blocks = layoutOverview([node('Les Psaumes', 40)], box);

    expect(blocks.filter((block) => !block.labelled)).toHaveLength(MAX_STEPS);
  });

  test('beaucoup d\'éléments dans peu de hauteur : des blocs « petits » (titre plus serré)', () => {
    const many = Array.from({ length: 20 }, (_, index) => node(`Époque ${index}`, 1));

    expect(layoutOverview(many, { width: 400, height: 600 }).find((block) => block.labelled).small).toBe(true);
    expect(layoutOverview(roots, box)[0].small).toBe(false);
  });
});
