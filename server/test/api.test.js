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
