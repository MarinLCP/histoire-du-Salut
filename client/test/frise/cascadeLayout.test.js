// Tests de la disposition de la frise (fonction pure) : quels blocs, où, lesquels ont un titre et lesquels sont cliquables.
// path : le chemin des nœuds dans lesquels on est entré ([] = vue d'ensemble, [1, 0] = 1er enfant du 2e nœud).

import { describe, test, expect } from 'vitest';
import { layoutCascade, MAX_STEPS } from '../../src/frise/cascadeLayout.js';

// Un nœud de l'API (forme commune à tous les niveaux) avec `childCount` enfants
const node = (title, childCount = 0) => ({
  title, detail: null, icon: 'sun', position: 1,
  children: Array.from({ length: childCount }, (_, index) => node(`${title} ${index + 1}`)),
});

const box = { width: 400, height: 600 };
const roots = [node('Les origines', 3), node('Les patriarches', 5)];

describe('layoutCascade : vue d\'ensemble', () => {
  test('un bloc avec titre par époque, et un petit bloc sans titre par épisode', () => {
    const blocks = layoutCascade(roots, [], box);
    const labelled = blocks.filter((block) => block.labelled);

    expect(labelled.map((block) => block.node.title)).toEqual(['Les origines', 'Les patriarches']);
    expect(blocks).toHaveLength(2 + 3 + 5);
    expect(labelled.map((block) => block.depth)).toEqual([1, 1]);
    expect(blocks.filter((block) => !block.labelled).every((block) => block.depth === 2)).toBe(true);
  });

  test('chaque bloc a une clé stable : son chemin dans l\'arbre', () => {
    const keys = layoutCascade(roots, [], box).map((block) => block.key);

    expect(keys.slice(0, 4)).toEqual(['0', '0.0', '0.1', '0.2']);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('chaque bloc passe au-dessus du précédent, et ses marches au-dessus de lui', () => {
    const [origins, ...rest] = layoutCascade(roots, [], box);
    const originsSteps = rest.filter((block) => block.key.startsWith('0.'));
    const patriarchs = rest.find((block) => block.key === '1');

    originsSteps.forEach((step) => {
      expect(step.z).toBeGreaterThan(origins.z);
      expect(step.z).toBeLessThan(patriarchs.z);
    });
  });

  test(`au plus ${MAX_STEPS} marches par bloc : au-delà, l'escalier serait illisible`, () => {
    const blocks = layoutCascade([node('Les Psaumes', 40)], [], box);

    expect(blocks.filter((block) => !block.labelled)).toHaveLength(MAX_STEPS);
  });

  test('beaucoup d\'éléments dans peu de hauteur : des blocs « petits » (titre plus serré)', () => {
    const many = Array.from({ length: 20 }, (_, index) => node(`Époque ${index}`, 1));

    expect(layoutCascade(many, [], { width: 400, height: 600 }).find((block) => block.labelled).small).toBe(true);
    expect(layoutCascade(roots, [], box)[0].small).toBe(false);
  });
});

// Trois niveaux : 2 époques → 2 épisodes chacune → 3 chapitres chacun
const deep = [0, 1].map((epoch) => ({
  ...node(`Époque ${epoch}`), children: [0, 1].map((episode) => node(`Épisode ${epoch}.${episode}`, 3)),
}));
const byKey = (blocks) => new Map(blocks.map((block) => [block.key, block]));

describe('layoutCascade : zoom', () => {
  test('vue d\'ensemble : les blocs de l\'escalier sont cliquables (descendre), les marches non', () => {
    const blocks = layoutCascade(deep, [], box);

    expect(blocks.filter((block) => block.kind === 'stair').map((block) => block.key)).toEqual(['0', '1']);
    expect(blocks.filter((block) => block.kind === 'step')).toHaveLength(4);
  });

  test('entré dans une époque : elle devient une bande verticale à gauche, ses épisodes forment l\'escalier', () => {
    const blocks = byKey(layoutCascade(deep, [1], box));

    expect(blocks.get('1')).toMatchObject({ kind: 'strip', left: 0, top: 0, height: 600, depth: 1 });
    expect([blocks.get('1.0').kind, blocks.get('1.1').kind]).toEqual(['stair', 'stair']);
    expect(blocks.get('1.0').depth).toBe(2);
    expect(blocks.get('1.0').left).toBe(blocks.get('1').width);
    expect(blocks.get('1.0.2').kind).toBe('step');
    // Les autres époques ne sont pas dessinées
    expect(blocks.has('0')).toBe(false);
  });

  test('deux niveaux plus bas : deux bandes côte à côte, en escalier elles aussi', () => {
    const blocks = byKey(layoutCascade(deep, [1, 0], box));
    const [epoch, episode] = [blocks.get('1'), blocks.get('1.0')];

    expect([epoch.kind, episode.kind]).toEqual(['strip', 'strip']);
    expect(episode.left).toBe(epoch.left + epoch.width);
    expect(episode.top).toBeGreaterThan(epoch.top);
    expect(blocks.get('1.0.0')).toMatchObject({ kind: 'stair', depth: 3, labelled: true });
    // Les chapitres n'ont pas d'enfants : pas de petites marches
    expect([...blocks.values()].filter((block) => block.kind === 'step')).toEqual([]);
  });

  test('le même nœud garde la même clé d\'un niveau à l\'autre (il glisse vers sa nouvelle place)', () => {
    const overview = byKey(layoutCascade(deep, [], box));
    const zoomed = byKey(layoutCascade(deep, [1], box));

    expect(overview.get('1.0').kind).toBe('step');
    expect(zoomed.get('1.0').kind).toBe('stair');
    expect(zoomed.get('1.0').width).toBeGreaterThan(overview.get('1.0').width);
  });

  test('une bande a son titre (écrit à la verticale), comme les blocs de l\'escalier', () => {
    const blocks = byKey(layoutCascade(deep, [1, 0], box));

    expect(blocks.get('1').labelled).toBe(true);
    expect(blocks.get('1.0.0').labelled).toBe(true);
  });
});
