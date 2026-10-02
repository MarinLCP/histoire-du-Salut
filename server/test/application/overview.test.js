// Tests unitaires des use cases « vue d'ensemble » (frise), avec de faux repositories (sans base).

import { describe, test, expect } from 'vitest';
import { makeGetHistoryOverview } from '../../src/application/getHistoryOverview.js';
import { makeGetBibleOverview } from '../../src/application/getBibleOverview.js';

describe('getHistoryOverview', () => {
  test('construit l\'arbre de l\'histoire à partir des listes du repository', async () => {
    const passageRepository = {
      findHistoryOutline: async () => ({
        epochs: [{ slug: 'origines', title: 'Les origines', icon: 'sun' }],
        episodes: [{ position: 1, title: 'La Création', icon: 'sun', epoch: 'origines' }],
        chapters: [{ passagePosition: 1, bookTitle: 'La Genèse', label: '1', fromVerse: '1', toVerse: '31',
          startsChapter: true, endsChapter: true }],
      }),
    };

    const [origins] = await makeGetHistoryOverview(passageRepository)();

    expect(origins.children[0].children[0].detail).toBe('chapitre 1 · en entier');
  });
});

describe('getBibleOverview', () => {
  test('construit l\'arbre de la Bible à partir des listes du repository', async () => {
    const bibleRepository = {
      findBibleOutline: async () => ({
        groups: [{ slug: 'actes', title: 'Les Actes des Apôtres', icon: 'wind' }],
        books: [{ code: 'Ac', title: 'Les Actes des Apôtres', group: 'actes' }],
        chapters: [{ position: 1, book: 'Ac', label: '1' }],
      }),
    };

    const [acts] = await makeGetBibleOverview(bibleRepository)();

    expect(acts.children[0].children[0].title).toBe('Chapitre 1');
  });
});
