// Tests de l'arbre « Bible entière » de la frise (ensembles → livres → dizaines → chapitres) : fonction pure.

import { describe, test, expect } from 'vitest';
import { buildBibleTree } from '../../src/domain/bibleOverview.js';

// count chapitres "1", "2"... pour le livre `book`, à partir de la position firstPosition
const chaptersOf = (book, count, firstPosition) =>
  Array.from({ length: count }, (_, index) => ({ position: firstPosition + index, book, label: String(index + 1) }));

const groups = [
  { slug: 'historiques', title: 'Les livres historiques', icon: 'crown' },
  { slug: 'sapientiaux', title: 'Les livres poétiques et sapientiaux', icon: 'feather' },
];
const books = [
  { code: 'Rt', title: 'Le Livre de Ruth', group: 'historiques' },
  { code: 'Est', title: 'Esther', group: 'historiques' },
  { code: 'Jb', title: 'Job', group: 'sapientiaux' },
];

const outline = (chapters) => ({ groups, books, chapters });
// Ruth : 4 chapitres (1 à 4), Esther : 15 (5 à 19), Job : 21 (20 à 40)
const small = outline([...chaptersOf('Rt', 4, 1), ...chaptersOf('Est', 15, 5), ...chaptersOf('Jb', 21, 20)]);

const titles = (nodes) => nodes.map((node) => node.title);

describe('buildBibleTree', () => {
  test('ensembles → livres → chapitres, avec les pictogrammes de chaque niveau', () => {
    const [historical, wisdom] = buildBibleTree(small);
    const ruth = historical.children[0];

    expect([historical.icon, wisdom.icon]).toEqual(['crown', 'feather']);
    expect(titles(historical.children)).toEqual(['Le Livre de Ruth', 'Esther']);
    expect(ruth.icon).toBe('book');
    expect(titles(ruth.children)).toEqual(['Chapitre 1', 'Chapitre 2', 'Chapitre 3', 'Chapitre 4']);
    expect(ruth.children[0].icon).toBe('page');
  });

  test('chaque nœud mène à son premier chapitre (position dans la lecture continue)', () => {
    const [historical, wisdom] = buildBibleTree(small);

    expect(historical.position).toBe(1);
    expect(historical.children[1].position).toBe(5);
    expect(wisdom.position).toBe(20);
    expect(historical.children[0].children[3].position).toBe(4);
  });

  test('jusqu\'à 15 chapitres : pas de niveau intermédiaire', () => {
    const esther = buildBibleTree(small)[0].children[1];

    expect(esther.children).toHaveLength(15);
    expect(esther.children[0].icon).toBe('page');
  });

  test('plus de 15 chapitres : un niveau par dizaine (la dernière peut n\'avoir qu\'un chapitre)', () => {
    const job = buildBibleTree(small)[1].children[0];

    expect(titles(job.children)).toEqual(['Chapitres 1-10', 'Chapitres 11-20', 'Chapitre 21']);
    expect(job.children[0].icon).toBe('pages');
    expect(job.children[1].position).toBe(30);
    expect(titles(job.children[2].children)).toEqual(['Chapitre 21']);
  });

  test('les dizaines suivent l\'ordre des chapitres, même avec des numéros spéciaux ("9A", "9B")', () => {
    const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9A', '9B', '10', '11', '12', '13', '14', '15', '16'];
    const psalms = labels.map((label, index) => ({ position: index + 1, book: 'Ps', label }));
    const [wisdom] = buildBibleTree({
      groups: groups.slice(1), books: [{ code: 'Ps', title: 'Livre des Psaumes', group: 'sapientiaux' }], chapters: psalms,
    });

    expect(titles(wisdom.children[0].children)).toEqual(['Chapitres 1-9B', 'Chapitres 10-16']);
  });

  test('les nœuds n\'ont pas de détail, et les chapitres n\'ont pas d\'enfants', () => {
    const ruth = buildBibleTree(small)[0].children[0];

    expect(ruth.detail).toBeNull();
    expect(ruth.children[0].children).toEqual([]);
  });

  test('base encore vide (pas d\'ensemble) : un arbre vide', () => {
    expect(buildBibleTree({ groups: [], books: [], chapters: [] })).toEqual([]);
  });
});
