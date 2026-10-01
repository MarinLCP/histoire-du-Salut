// Tests de GET /api/health : on envoie de fausses requêtes HTTP à l'app avec supertest.
// Ces tests lisent la base de dev : lancer npm run seed avant si elle est vide.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createApp } from '../../src/http/createApp.js';
import { pool } from '../../src/infrastructure/db.js';

// Ferme les connexions à Postgres à la fin, sinon le processus reste ouvert
afterAll(() => pool.end());

describe('GET /api/health', () => {
  test('quand le serveur et la base répondent : 200', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'ok' });
  });

  test('quand la base est injoignable : 503, pour que l\'hébergeur le sache', async () => {
    // Une app dont la vérification de la base échoue : on simule une base injoignable
    const appWithDatabaseDown = createApp({
      pingDatabase: () => Promise.reject(new Error('connect ECONNREFUSED')),
      clientBuildDirectory: '/dossier-inexistant', // pas de site à servir dans ce test
    });

    const res = await request(appWithDatabaseDown).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'error', database: 'unreachable' });
  });
});
