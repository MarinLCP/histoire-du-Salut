// Tests de l'API des comptes de bout en bout (supertest + base de dev) : créer un compte, cookie de session,
// qui est connecté, se déconnecter, se reconnecter, limite d'essais, supprimer son compte.
// Les comptes de test ont des adresses en @exemple.test, effacés à la fin.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/infrastructure/db.js';

const TEST_DOMAIN = '@exemple.test';
const PASSWORD = 'un mot de passe long';
// Une adresse différente à chaque test : ils ne se gênent pas
const newEmail = () => `lecteur-${Math.random().toString(36).slice(2)}${TEST_DOMAIN}`;

afterAll(async () => {
  // Seulement les comptes de CE fichier : les autres fichiers de test tournent en même temps
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`lecteur-%${TEST_DOMAIN}`]);
  await pool.end();
});

describe('API des comptes', () => {
  test('créer un compte : 201, connecté dans la foulée (cookie httpOnly, SameSite=Lax)', async () => {
    const agent = request.agent(app);
    const email = newEmail();

    const res = await agent.post('/api/account').send({ email, password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ user: { email } });
    expect(res.headers['set-cookie'][0]).toMatch(/^session=.+HttpOnly; SameSite=Lax/);
    expect(res.headers['cache-control']).toBe('no-store');
    expect((await agent.get('/api/session')).body).toEqual({ user: { email } });
  });

  test('le mot de passe n\'est jamais rangé tel quel, ni le jeton de session', async () => {
    const agent = request.agent(app);
    const email = newEmail();
    const res = await agent.post('/api/account').send({ email, password: PASSWORD });
    const token = res.headers['set-cookie'][0].match(/^session=([^;]+)/)[1];

    const { rows: [user] } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [email]);
    const { rows: sessions } = await pool.query('SELECT token_hash FROM sessions WHERE token_hash = $1', [token]);

    expect(user.password_hash.startsWith('scrypt$')).toBe(true);
    expect(user.password_hash).not.toContain(PASSWORD);
    expect(sessions).toHaveLength(0);
  });

  test('sans session : personne de connecté (ce n\'est pas une erreur)', async () => {
    const res = await request(app).get('/api/session');

    expect(res.body).toEqual({ user: null });
  });

  test('e-mail déjà pris : 409 ; mot de passe trop court : 400', async () => {
    const email = newEmail();
    await request(app).post('/api/account').send({ email, password: PASSWORD });

    expect((await request(app).post('/api/account').send({ email, password: PASSWORD })).status).toBe(409);
    expect((await request(app).post('/api/account').send({ email: newEmail(), password: 'court' })).status).toBe(400);
  });

  test('se déconnecter puis se reconnecter', async () => {
    const agent = request.agent(app);
    const email = newEmail();
    await agent.post('/api/account').send({ email, password: PASSWORD });

    expect((await agent.delete('/api/session')).status).toBe(204);
    expect((await agent.get('/api/session')).body).toEqual({ user: null });

    const res = await agent.post('/api/session').send({ email: email.toUpperCase(), password: PASSWORD });
    expect(res.status).toBe(200);
    expect((await agent.get('/api/session')).body).toEqual({ user: { email } });
  });

  test('mauvais mot de passe : 401 ; après 10 échecs, 429 même avec le bon', async () => {
    const email = newEmail();
    await request(app).post('/api/account').send({ email, password: PASSWORD });

    const wrong = await request(app).post('/api/session').send({ email, password: 'pas le bon mot' });
    expect(wrong.status).toBe(401);
    expect(wrong.body).toEqual({ error: 'E-mail ou mot de passe incorrect.' });

    for (let attempt = 1; attempt < 10; attempt++) {
      await request(app).post('/api/session').send({ email, password: 'pas le bon mot' });
    }
    expect((await request(app).post('/api/session').send({ email, password: PASSWORD })).status).toBe(429);
  }, 30000);

  test('supprimer son compte : mot de passe exigé, puis le compte et ses sessions disparaissent', async () => {
    const agent = request.agent(app);
    const email = newEmail();
    await agent.post('/api/account').send({ email, password: PASSWORD });

    expect((await agent.delete('/api/account').send({ password: 'pas le bon mot' })).status).toBe(401);
    expect((await agent.delete('/api/account').send({ password: PASSWORD })).status).toBe(204);

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    expect(rows).toHaveLength(0);
    expect((await agent.get('/api/session')).body).toEqual({ user: null });
    expect((await request(app).post('/api/session').send({ email, password: PASSWORD })).status).toBe(401);
  });

  test('le reste de l\'API n\'est pas touché par le « no-store » des comptes', async () => {
    const res = await request(app).get('/api/overview/bible');

    expect(res.headers['cache-control']).not.toBe('no-store');
  });

  test('des essais envoyés tous en même temps : 10 au plus sont vérifiés, les autres attendent (429)', async () => {
    const email = newEmail();
    await request(app).post('/api/account').send({ email, password: PASSWORD });

    const responses = await Promise.all(Array.from({ length: 15 }, () => request(app).post('/api/session').send({ email, password: 'pas le bon mot' })));
    const statuses = responses.map((res) => res.status);

    expect(statuses.filter((status) => status === 401)).toHaveLength(10);
    expect(statuses.filter((status) => status === 429)).toHaveLength(5);
  }, 30000);

  test('une session expirée ne vaut plus rien (ni « qui est connecté », ni « à moi »)', async () => {
    const agent = request.agent(app);
    const email = newEmail();
    await agent.post('/api/account').send({ email, password: PASSWORD });

    await pool.query(
      `UPDATE sessions SET expires_at = now() - interval '1 day'
       WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email],
    );

    expect((await agent.get('/api/session')).body).toEqual({ user: null });
    expect((await agent.get('/api/me/library')).status).toBe(401);
  });

  test('supprimer un compte sans être connecté : 401', async () => {
    expect((await request(app).delete('/api/account').send({ password: PASSWORD })).status).toBe(401);
  });
});
