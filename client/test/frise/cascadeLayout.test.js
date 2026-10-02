// Tests de la disposition de la frise (fonction pure) : quels blocs, où, lesquels ont un titre et lesquels sont cliquables.
// path : le chemin des nœuds dans lesquels on est entré ([] = vue d'ensemble, [1, 0] = 1er enfant du 2e nœud).

import { describe, test, expect } from 'vitest';
import { layoutCascade, boatPlace, MAX_STEPS } from '../../src/frise/cascadeLayout.js';

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
    const withTitle = blocks.filter((block) => block.role !== 'step');

    expect(withTitle.map((block) => block.node.title)).toEqual(['Les origines', 'Les patriarches']);
    expect(blocks).toHaveLength(2 + 3 + 5);
    expect(withTitle.map((block) => block.depth)).toEqual([1, 1]);
    expect(blocks.filter((block) => block.role === 'step').every((block) => block.depth === 2)).toBe(true);
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
      expect(step.layer).toBeGreaterThan(origins.layer);
      expect(step.layer).toBeLessThan(patriarchs.layer);
    });
  });

  test('zone étroite (panneau sur téléphone) : le premier bloc garde la place d\'un titre', () => {
    const many = Array.from({ length: 10 }, (_, index) => node(`Époque ${index}`, 1));
    const [first] = layoutCascade(many, [], { width: 260, height: 600 });

    expect(first.width).toBeGreaterThanOrEqual(120);
  });

  test(`au plus ${MAX_STEPS} marches par bloc : au-delà, l'escalier serait illisible`, () => {
    const blocks = layoutCascade([node('Les Psaumes', 40)], [], box);

    expect(blocks.filter((block) => block.role === 'step')).toHaveLength(MAX_STEPS);
  });

  test('beaucoup d\'éléments dans peu de hauteur : des blocs « petits » (titre plus serré)', () => {
    const many = Array.from({ length: 20 }, (_, index) => node(`Époque ${index}`, 1));

    expect(layoutCascade(many, [], { width: 400, height: 600 }).find((block) => block.role === 'stair').small).toBe(true);
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

    expect(blocks.filter((block) => block.role === 'stair').map((block) => block.key)).toEqual(['0', '1']);
    expect(blocks.filter((block) => block.role === 'step')).toHaveLength(4);
  });

  test('entré dans une époque : elle devient une bande verticale à gauche, ses épisodes forment l\'escalier', () => {
    const blocks = byKey(layoutCascade(deep, [1], box));

    expect(blocks.get('1')).toMatchObject({ role: 'strip', left: 0, top: 0, height: 600, depth: 1 });
    expect([blocks.get('1.0').role, blocks.get('1.1').role]).toEqual(['stair', 'stair']);
    expect(blocks.get('1.0').depth).toBe(2);
    expect(blocks.get('1.0').left).toBe(blocks.get('1').width);
    expect(blocks.get('1.0.2').role).toBe('step');
    // Les autres époques ne sont pas dessinées
    expect(blocks.has('0')).toBe(false);
  });

  test('deux niveaux plus bas : deux bandes côte à côte, en escalier elles aussi', () => {
    const blocks = byKey(layoutCascade(deep, [1, 0], box));
    const [epoch, episode] = [blocks.get('1'), blocks.get('1.0')];

    expect([epoch.role, episode.role]).toEqual(['strip', 'strip']);
    expect(episode.left).toBe(epoch.left + epoch.width);
    expect(episode.top).toBeGreaterThan(epoch.top);
    expect(blocks.get('1.0.0')).toMatchObject({ role: 'stair', depth: 3 });
    // Les chapitres n'ont pas d'enfants : pas de petites marches
    expect([...blocks.values()].filter((block) => block.role === 'step')).toEqual([]);
  });

  test('le même nœud garde la même clé d\'un niveau à l\'autre (il glisse vers sa nouvelle place)', () => {
    const overview = byKey(layoutCascade(deep, [], box));
    const zoomed = byKey(layoutCascade(deep, [1], box));

    expect(overview.get('1.0').role).toBe('step');
    expect(zoomed.get('1.0').role).toBe('stair');
    expect(zoomed.get('1.0').width).toBeGreaterThan(overview.get('1.0').width);
  });

});

describe('boatPlace : le bateau glisse d\'un bloc de l\'escalier au suivant, au fil de la lecture', () => {
  const blocks = layoutCascade(deep, [], box);
  const stairs = blocks.filter((block) => block.role === 'stair');
  // Le bateau se pose au bord droit du haut du bloc, juste au-dessus
  const anchorOf = (block) => ({ left: block.left + block.width - 38, top: block.top - 22 });

  test('au début d\'un bloc : posé sur ce bloc', () => {
    expect(boatPlace(blocks, { rank: 1, fraction: 0 })).toEqual(anchorOf(stairs[1]));
  });

  test('à mi-lecture d\'un bloc : à mi-chemin du bloc suivant (le premier bloc touche le haut : le bateau y reste visible)', () => {
    const [from, to] = [anchorOf(stairs[0]), anchorOf(stairs[1])];

    expect(boatPlace(blocks, { rank: 0, fraction: 0.5 })).toEqual({
      left: (from.left + to.left) / 2, top: Math.max(-6, (from.top + to.top) / 2),
    });
    expect(boatPlace(blocks, { rank: 0, fraction: 0 }).top).toBe(-6);
  });

  test('dernier bloc : le bateau y reste, sans sortir du cadre', () => {
    const place = boatPlace(blocks, { rank: 1, fraction: 0.9 });

    expect(place.left).toBe(anchorOf(stairs[1]).left);
    expect(place.top).toBeGreaterThanOrEqual(-6);
  });

  test('les blocs de l\'escalier portent leur écume ; le premier n\'en a pas', () => {
    expect(stairs[0].foam).toBeNull();
    expect(stairs[1].foam).not.toBeNull();
  });
});
