// Tests de l'API « vue d'ensemble » de la frise : GET /api/overview/history et /api/overview/bible.
// Ces tests lisent la base de dev (npm run db:migrate et npm run seed avant) et la comparent
// aux fichiers de données : ils restent vrais quand Marin ajoute ou change des épisodes.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/infrastructure/db.js';
import { epochs } from '../../db/epochs.data.js';
import { passages } from '../../db/passages.data.js';
import { bibleGroups } from '../../db/bible-groups.data.js';

afterAll(() => pool.end());

// Les feuilles de l'arbre (les nœuds sans enfants), dans l'ordre
const leavesOf = (nodes) => nodes.flatMap((node) => (node.children.length ? leavesOf(node.children) : [node]));

describe('GET /api/overview/history', () => {
  test('les époques, puis leurs épisodes, dans l\'ordre des fichiers de données', async () => {
    const res = await request(app).get('/api/overview/history');
    const episodes = res.body.flatMap((epoch) => epoch.children);

    expect(res.status).toBe(200);
    expect(res.body.map((epoch) => [epoch.title, epoch.icon])).toEqual(epochs.map((epoch) => [epoch.title, epoch.icon]));
    expect(episodes.map((episode) => [episode.title, episode.icon])).toEqual(passages.map((passage) => [passage.title, passage.icon]));
    expect(episodes.map((episode) => episode.position)).toEqual(passages.map((_, index) => index + 1));
  });

  test('chaque épisode couvre ses chapitres, du chapitre de début au chapitre de fin', async () => {
    const res = await request(app).get('/api/overview/history');
    const episodes = res.body.flatMap((epoch) => epoch.children);

    episodes.forEach((episode, index) => {
      const details = episode.children.map((chapter) => chapter.detail);
      expect(details[0]).toMatch(new RegExp(`^chapitre ${passages[index].start[0]} · `));
      expect(details.at(-1)).toMatch(new RegExp(`^chapitre ${passages[index].end[0]} · `));
    });
  });

  test('un épisode qui commence en cours de chapitre le dit (« à partir du v. 13 », ou « v. 13-... »)', async () => {
    const res = await request(app).get('/api/overview/history');
    const episodes = res.body.flatMap((epoch) => epoch.children);
    const startsMidChapter = passages.filter((passage) => passage.start[1] !== '1');

    startsMidChapter.forEach((passage) => {
      const episode = episodes.find((candidate) => candidate.title === passage.title);
      expect(episode.children[0].detail).toMatch(new RegExp(`(à partir du v\\. |· v\\. )${passage.start[1]}(-|$)`));
    });
  });
});

describe('GET /api/overview/bible', () => {
  test('les grands ensembles, dans l\'ordre du fichier de données, et les 74 livres', async () => {
    const res = await request(app).get('/api/overview/bible');

    expect(res.status).toBe(200);
    expect(res.body.map((group) => group.title)).toEqual(bibleGroups.map((group) => group.title));
    expect(res.body.flatMap((group) => group.children)).toHaveLength(74);
  });

  test('chaque chapitre de la Bible apparaît une fois, dans l\'ordre de lecture', async () => {
    const res = await request(app).get('/api/overview/bible');
    const positions = leavesOf(res.body).map((chapter) => chapter.position);

    expect(positions).toEqual(positions.map((_, index) => index + 1));
    expect(positions.length).toBeGreaterThan(1300);
  });

  test('un livre de plus de 15 chapitres est découpé en dizaines (ex. les Psaumes)', async () => {
    const res = await request(app).get('/api/overview/bible');
    const psalms = res.body.flatMap((group) => group.children).find((book) => book.title === 'Livre des Psaumes');

    expect(psalms.children[0].title).toBe('Chapitres 1-9B');
    expect(psalms.children.every((tens) => tens.icon === 'pages')).toBe(true);
  });
});
