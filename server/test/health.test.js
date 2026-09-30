// Tests de GET /api/health : on envoie de fausses requêtes HTTP à l'app avec supertest.
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
