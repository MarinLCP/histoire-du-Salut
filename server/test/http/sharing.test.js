// Tests de l'API du partage de progression (supertest + base de dev) : pseudo, lien de partage, ce que
// montre le lien (sans compte), « Arrêter de partager ». Comptes de test en @exemple.test, effacés à la fin.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import { appWithOutbox, signedUpAgent } from './helpers/accounts.js';
import { pool } from '../../src/infrastructure/db.js';

const TEST_DOMAIN = '@exemple.test';

afterAll(async () => {
  // Seulement les comptes de CE fichier : les autres fichiers de test tournent en même temps
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`partage-%${TEST_DOMAIN}`]);
  await pool.end();
});

const world = appWithOutbox();
const { app } = world;

// Un lecteur inscrit, validé, connecté (agent : garde son cookie de session)
function signedInReader() {
  return signedUpAgent(world, `partage-${Math.random().toString(36).slice(2)}${TEST_DOMAIN}`, 'un mot de passe long');
}

describe('API du partage de progression', () => {
  test('rien n\'est partagé au départ', async () => {
    const reader = await signedInReader();

    expect((await reader.get('/api/me/sharing')).body).toEqual({ token: null });
  });

  test('un lien, toujours le même, qui montre où on en est (sans compte, sans e-mail ; compte e-mail : sans nom)', async () => {
    const reader = await signedInReader();
    await reader.put('/api/me/readings/history').send({ position: 2.4 });
    await reader.put('/api/me/readings/bible').send({ position: 3.1 });

    const { token } = (await reader.post('/api/me/sharing')).body;
    expect((await reader.post('/api/me/sharing')).body.token).toBe(token);

    const res = await request(app).get(`/api/progress/${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      name: null,
      history: { episode: 2, total: 32, slug: 'chute', title: 'La chute' },
      bible: { book: { code: 'Gn', title: 'La Genèse' }, chapter: '3' },
    });
    expect(JSON.stringify(res.body)).not.toContain(TEST_DOMAIN);
  });

  test('le prénom donné par Google, quand le compte en a un', async () => {
    const reader = await signedInReader();
    const { token } = (await reader.post('/api/me/sharing')).body;
    await pool.query(
      `UPDATE users SET given_name = 'Marin'
       WHERE id = (SELECT user_id FROM progress_shares WHERE token = $1)`,
      [token],
    );

    expect((await request(app).get(`/api/progress/${token}`)).body).toEqual({ name: 'Marin', history: null, bible: null });
  });

  test('« Arrêter de partager » : le lien ne mène plus nulle part (404)', async () => {
    const reader = await signedInReader();
    const { token } = (await reader.post('/api/me/sharing')).body;

    expect((await reader.delete('/api/me/sharing')).status).toBe(204);

    expect((await request(app).get(`/api/progress/${token}`)).status).toBe(404);
    expect((await reader.get('/api/me/sharing')).body.token).toBeNull();
  });

  test('un lien inventé : 404 ; sans être connecté : 401', async () => {
    expect((await request(app).get('/api/progress/lien-invente')).status).toBe(404);
    expect((await request(app).get('/api/me/sharing')).status).toBe(401);
  });
});
