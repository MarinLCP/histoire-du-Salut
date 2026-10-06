// Tests de l'API du partage de progression (supertest + base de dev) : pseudo, lien de partage, ce que
// montre le lien (sans compte), « Arrêter de partager ». Comptes de test en @exemple.test, effacés à la fin.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/infrastructure/db.js';

const TEST_DOMAIN = '@exemple.test';

afterAll(async () => {
  // Seulement les comptes de CE fichier : les autres fichiers de test tournent en même temps
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`partage-%${TEST_DOMAIN}`]);
  await pool.end();
});

async function signedInReader() {
  const agent = request.agent(app);
  await agent.post('/api/account').send({ email: `partage-${Math.random().toString(36).slice(2)}${TEST_DOMAIN}`, password: 'un mot de passe long' });
  return agent;
}

describe('API du partage de progression', () => {
  test('pas de pseudo : pas de lien (400), et rien n\'est partagé au départ', async () => {
    const reader = await signedInReader();

    expect((await reader.get('/api/me/sharing')).body).toEqual({ displayName: null, token: null });
    expect((await reader.post('/api/me/sharing')).status).toBe(400);
  });

  test('avec un pseudo : un lien, toujours le même, qui montre où on en est (sans compte, sans e-mail)', async () => {
    const reader = await signedInReader();
    const profile = await reader.put('/api/me/profile').send({ displayName: '  Marin ' });
    expect(profile.body).toEqual({ displayName: 'Marin' });
    await reader.put('/api/me/bookmarks/history').send({ position: 2.4 });
    await reader.put('/api/me/bookmarks/bible').send({ position: 3.1 });

    const { token } = (await reader.post('/api/me/sharing')).body;
    expect((await reader.post('/api/me/sharing')).body.token).toBe(token);

    const res = await request(app).get(`/api/progress/${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      displayName: 'Marin',
      history: { episode: 2, total: 32, slug: 'chute', title: 'La chute' },
      bible: { book: { code: 'Gn', title: 'La Genèse' }, chapter: '3' },
    });
    expect(JSON.stringify(res.body)).not.toContain(TEST_DOMAIN);
  });

  test('pas encore commencé : history et bible à null', async () => {
    const reader = await signedInReader();
    await reader.put('/api/me/profile').send({ displayName: 'Lecteur' });
    const { token } = (await reader.post('/api/me/sharing')).body;

    expect((await request(app).get(`/api/progress/${token}`)).body).toEqual({ displayName: 'Lecteur', history: null, bible: null });
  });

  test('« Arrêter de partager » : le lien ne mène plus nulle part (404)', async () => {
    const reader = await signedInReader();
    await reader.put('/api/me/profile').send({ displayName: 'Marin' });
    const { token } = (await reader.post('/api/me/sharing')).body;

    expect((await reader.delete('/api/me/sharing')).status).toBe(204);

    expect((await request(app).get(`/api/progress/${token}`)).status).toBe(404);
    expect((await reader.get('/api/me/sharing')).body.token).toBeNull();
  });

  test('un lien inventé : 404 ; un pseudo invalide : 400 ; sans être connecté : 401', async () => {
    const reader = await signedInReader();

    expect((await request(app).get('/api/progress/lien-invente')).status).toBe(404);
    expect((await reader.put('/api/me/profile').send({ displayName: '<b>' })).status).toBe(400);
    expect((await request(app).get('/api/me/sharing')).status).toBe(401);
  });
});
