// Tests de l'arbre « Histoire du salut » de la frise (époques → épisodes → chapitres couverts) : fonction pure.

import { describe, test, expect } from 'vitest';
import { buildHistoryTree } from '../../src/domain/historyOverview.js';

// Un chapitre couvert par un épisode, tel que le repository le renvoie
const covered = (passagePosition, label, fromVerse, toVerse, startsChapter, endsChapter) =>
  ({ passagePosition, bookTitle: 'La Genèse', label, fromVerse, toVerse, startsChapter, endsChapter });

const outline = {
  epochs: [
    { slug: 'origines', title: 'Les origines', icon: 'sun' },
    { slug: 'patriarches', title: 'Les patriarches', icon: 'tent' },
  ],
  episodes: [
    { position: 1, title: 'La Création', icon: 'sun', epoch: 'origines' },
    { position: 2, title: 'La chute', icon: 'tree', epoch: 'origines' },
    { position: 3, title: "L'appel d'Abraham", icon: 'tent', epoch: 'patriarches' },
  ],
  chapters: [
    covered(1, '1', '1', '31', true, true),
    covered(1, '2', '1', '4a', true, false),
    covered(2, '3', '1', '24', true, true),
    covered(3, '12', '1', '9', true, true),
  ],
};

describe('buildHistoryTree', () => {
  test('époques → épisodes → chapitres couverts, chacun avec son titre et son pictogramme', () => {
    const tree = buildHistoryTree(outline);

    expect(tree.map((epoch) => epoch.title)).toEqual(['Les origines', 'Les patriarches']);
    expect(tree[0].children.map((episode) => [episode.title, episode.icon])).toEqual([['La Création', 'sun'], ['La chute', 'tree']]);
    expect(tree[0].children[0].children.map((chapter) => [chapter.title, chapter.icon])).toEqual([
      ['La Genèse', 'page'], ['La Genèse', 'page'],
    ]);
  });

  test('chaque nœud mène à la lecture de son premier épisode (position dans la timeline)', () => {
    const [origins, patriarchs] = buildHistoryTree(outline);

    expect(origins.position).toBe(1);
    expect(patriarchs.position).toBe(3);
    expect(origins.children[1].position).toBe(2);
    expect(origins.children[0].children.map((chapter) => chapter.position)).toEqual([1, 1]);
  });

  test('le détail d\'un chapitre dit quelle partie l\'épisode en couvre', () => {
    // Un seul épisode, qui couvre un seul chapitre
    const detailOf = (chapter) => buildHistoryTree({
      epochs: outline.epochs.slice(0, 1), episodes: outline.episodes.slice(0, 1), chapters: [chapter],
    })[0].children[0].children[0].detail;

    expect(detailOf(covered(1, '1', '1', '31', true, true))).toBe('chapitre 1 · en entier');
    expect(detailOf(covered(1, '2', '1', '4a', true, false))).toBe("chapitre 2 · jusqu'au v. 4a");
    expect(detailOf(covered(1, '52', '13', '15', false, true))).toBe('chapitre 52 · à partir du v. 13');
    expect(detailOf(covered(1, '15', '1b', '6', false, false))).toBe('chapitre 15 · v. 1b-6');
  });

  test('époques et épisodes n\'ont pas de détail, et les chapitres n\'ont pas d\'enfants', () => {
    const [origins] = buildHistoryTree(outline);

    expect(origins.detail).toBeNull();
    expect(origins.children[0].detail).toBeNull();
    expect(origins.children[0].children[0].children).toEqual([]);
  });

  test('base encore vide (pas d\'époque) : un arbre vide', () => {
    expect(buildHistoryTree({ epochs: [], episodes: [], chapters: [] })).toEqual([]);
  });
});
