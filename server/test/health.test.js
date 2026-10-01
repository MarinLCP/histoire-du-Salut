// Tests de GET /api/health : on envoie de fausses requêtes HTTP à l'app avec supertest.
// Ces tests lisent la base de dev : lancer npm run seed avant si elle est vide.

import { describe, test, expect, vi, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/db.js';

// Ferme les connexions à Postgres à la fin, sinon le processus reste ouvert
afterAll(() => pool.end());

// Remet la vraie fonction pool.query après un test qui l'a remplacée
afterEach(() => vi.restoreAllMocks());

describe('GET /api/health', () => {
  test('quand le serveur et la base répondent : 200', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'ok' });
  });

  test('quand la base est injoignable : 503, pour que l\'hébergeur le sache', async () => {
    // On simule une base injoignable, sans toucher à la vraie
    vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'error', database: 'unreachable' });
  });
});
