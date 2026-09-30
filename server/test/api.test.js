// Tests de l'API : on envoie de fausses requêtes HTTP à l'app avec supertest.
// Ces tests lisent la base de dev : lancer npm run seed avant si elle est vide.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/db.js';

// Ferme les connexions à Postgres à la fin, sinon le processus reste ouvert
afterAll(() => pool.end());

describe('GET /api/health', () => {
  test('répond 200 avec { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/passages/:id', () => {
  test('renvoie un passage avec ses versets', async () => {
    const res = await request(app).get('/api/passages/1');

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('La Création');
    expect(res.body.book).toEqual({ code: 'Gn', title: 'La Genèse' });
    expect(res.body.verses.length).toBeGreaterThan(0);
  });

  test('commence et finit aux bonnes bornes, même sur deux chapitres', async () => {
    // Le Serviteur souffrant : Is 52,13 – 53,12
    const res = await request(app).get('/api/passages/22');
    const verses = res.body.verses;

    expect(verses[0]).toMatchObject({ chapter: '52', verse: '13' });
    expect(verses.at(-1)).toMatchObject({ chapter: '53', verse: '12' });
    expect(verses.length).toBe(15);
  });

  test('renvoie 404 pour un passage qui n\'existe pas', async () => {
    const res = await request(app).get('/api/passages/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test.each(['abc', '0', '-1', '1.5'])('renvoie 400 pour l\'id "%s"', async (id) => {
    const res = await request(app).get(`/api/passages/${id}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/timeline', () => {
  test('sans paramètre, renvoie les 5 premiers passages', async () => {
    const res = await request(app).get('/api/timeline');

    expect(res.status).toBe(200);
    expect(res.body.passages.map((p) => p.position)).toEqual([1, 2, 3, 4, 5]);
    expect(res.body.nextCursor).toBe(5);
  });

  test('?after=3&limit=5 renvoie les passages 4 à 8', async () => {
    const res = await request(app).get('/api/timeline?after=3&limit=5');

    expect(res.body.passages.map((p) => p.position)).toEqual([4, 5, 6, 7, 8]);
    expect(res.body.nextCursor).toBe(8);
  });

  test('chaque passage contient ses versets', async () => {
    const res = await request(app).get('/api/timeline?limit=1');

    expect(res.body.passages[0].title).toBe('La Création');
    expect(res.body.passages[0].verses.length).toBeGreaterThan(0);
  });

  test('nextCursor permet d\'enchaîner les pages sans trou ni doublon', async () => {
    const page1 = await request(app).get('/api/timeline?limit=3');
    const page2 = await request(app).get(`/api/timeline?after=${page1.body.nextCursor}&limit=3`);

    const positions = [...page1.body.passages, ...page2.body.passages].map((p) => p.position);
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
