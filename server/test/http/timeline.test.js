// Tests de GET /api/timeline : on envoie de fausses requêtes HTTP à l'app avec supertest.
// Ces tests lisent la base de dev : lancer npm run seed avant si elle est vide.

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/infrastructure/db.js';

// Ferme les connexions à Postgres à la fin, sinon le processus reste ouvert
afterAll(() => pool.end());

describe('GET /api/timeline', () => {
  test('sans paramètre, renvoie les 5 premiers passages', async () => {
    const res = await request(app).get('/api/timeline');

    expect(res.status).toBe(200);
    expect(res.body.passages.map((passage) => passage.position)).toEqual([1, 2, 3, 4, 5]);
    expect(res.body.nextCursor).toBe(5);
  });

  test('?after=3&limit=5 renvoie les passages 4 à 8', async () => {
    const res = await request(app).get('/api/timeline?after=3&limit=5');

    expect(res.body.passages.map((passage) => passage.position)).toEqual([4, 5, 6, 7, 8]);
    expect(res.body.nextCursor).toBe(8);
  });

  test('chaque passage contient son slug et ses versets', async () => {
    const res = await request(app).get('/api/timeline?limit=1');

    expect(res.body.passages[0].slug).toBe('creation');
    expect(res.body.passages[0].verses.length).toBeGreaterThan(0);
  });

  test('nextCursor permet d\'enchaîner les pages sans trou ni doublon', async () => {
    const page1 = await request(app).get('/api/timeline?limit=3');
    const page2 = await request(app).get(`/api/timeline?after=${page1.body.nextCursor}&limit=3`);

    const positions = [...page1.body.passages, ...page2.body.passages].map((passage) => passage.position);
    expect(positions).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test.each([
    ['after=-1'],
    ['after=abc'],
    ['limit=0'],
    ['limit=21'],
    ['limit=abc'],
  ])('renvoie 400 pour ?%s', async (query) => {
    const res = await request(app).get(`/api/timeline?${query}`);

    expect(res.status).toBe(400);
  });
});

// Fin de la timeline : ces tests ne supposent pas un nombre précis de passages,
// ils parcourent l'API comme le ferait le front.
describe('GET /api/timeline : fin de la timeline', () => {
  // Garde-fou : si nextCursor ne devient jamais null, le test échoue au lieu de tourner à l'infini
  const MAX_PAGES = 100;

  // Parcourt toute la timeline page par page, comme un utilisateur qui scrolle
  async function scrollToTheEnd(limit) {
    const pages = [];
    let after = 0;

    for (let pageCount = 0; pageCount < MAX_PAGES; pageCount++) {
      const res = await request(app).get(`/api/timeline?after=${after}&limit=${limit}`);
      pages.push(res.body);
      if (res.body.nextCursor === null) return pages;
      after = res.body.nextCursor;
    }
    throw new Error('La timeline ne se termine jamais');
  }

  // Position du dernier passage, trouvée une seule fois en scrollant jusqu'au bout
  let lastPosition;
  beforeAll(async () => {
    const pages = await scrollToTheEnd(20);
    lastPosition = pages.at(-1).passages.at(-1).position;
  });

  test('en scrollant, on arrive au bout, sans doublon et sans page vide', async () => {
    const pages = await scrollToTheEnd(5);
    const positions = pages.flatMap((page) => page.passages.map((passage) => passage.position));

    expect(pages.every((page) => page.passages.length > 0)).toBe(true);
    expect(new Set(positions).size).toBe(positions.length);
  });

  test('après le dernier passage, la timeline est vide (et ce n\'est pas une erreur)', async () => {
    const res = await request(app).get(`/api/timeline?after=${lastPosition}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ passages: [], nextCursor: null });
  });

  test('une page pleine qui finit pile sur le dernier passage annonce qu\'il n\'y a plus rien', async () => {
    const res = await request(app).get(`/api/timeline?after=${lastPosition - 5}&limit=5`);

    expect(res.body.passages).toHaveLength(5);
    expect(res.body.passages.at(-1).position).toBe(lastPosition);
    expect(res.body.nextCursor).toBeNull();
  });

  test('un curseur très loin après la fin renvoie une timeline vide', async () => {
    const res = await request(app).get('/api/timeline?after=999999');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ passages: [], nextCursor: null });
  });
});
