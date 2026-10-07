// Tests de l'API des comptes de bout en bout (supertest + base de dev) : créer un compte, valider l'e-mail
// par un code, cookie de session, qui est connecté, se déconnecter, se reconnecter, limites d'essais,
// supprimer son compte. Les e-mails restent dans une boîte de test. Comptes en @exemple.test, effacés à la fin.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../../src/infrastructure/db.js';
import { appWithOutbox, codeSentTo, signedUpAgent } from './helpers/accounts.js';

const TEST_DOMAIN = '@exemple.test';
const PASSWORD = 'un mot de passe long';
const world = appWithOutbox();
const { app, outbox } = world;
// Une adresse différente à chaque test : ils ne se gênent pas
const newEmail = () => `lecteur-${Math.random().toString(36).slice(2)}${TEST_DOMAIN}`;

afterAll(async () => {
  // Seulement les comptes de CE fichier : les autres fichiers de test tournent en même temps
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`lecteur-%${TEST_DOMAIN}`]);
  await pool.end();
});

describe('créer un compte et valider l\'e-mail', () => {
  test('créer un compte : 202, un code envoyé par e-mail, pas encore de session', async () => {
    const agent = request.agent(app);
    const email = newEmail();

    const res = await agent.post('/api/account').send({ email, password: PASSWORD });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({ verificationNeeded: true, email });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(codeSentTo(outbox, email)).toMatch(/^\d{6}$/);
    expect((await agent.get('/api/session')).body).toEqual({ user: null });
  });

  test('le bon code : connecté (cookie httpOnly, SameSite=Lax), une seule fois', async () => {
    const agent = request.agent(app);
    const email = newEmail();
    await agent.post('/api/account').send({ email, password: PASSWORD });
    const code = codeSentTo(outbox, email);

    const res = await agent.post('/api/account/verify').send({ email, code });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { email } });
    expect(res.headers['set-cookie'][0]).toMatch(/^session=.+HttpOnly; SameSite=Lax/);
    expect(res.headers['cache-control']).toBe('no-store');
    expect((await agent.get('/api/session')).body).toEqual({ user: { email, hasPassword: true } });
    expect((await agent.post('/api/account/verify').send({ email, code })).status).toBe(400);
  });

  test('un mauvais code : 400 ; au 5e essai raté, le code ne vaut plus rien ; un nouveau code marche', async () => {
    const email = newEmail();
    await request(app).post('/api/account').send({ email, password: PASSWORD });
    const code = codeSentTo(outbox, email);
    const wrong = code === '000000' ? '111111' : '000000';

    const first = await request(app).post('/api/account/verify').send({ email, code: wrong });
    for (let attempt = 2; attempt <= 5; attempt++) await request(app).post('/api/account/verify').send({ email, code: wrong });

    expect(first.body).toEqual({ error: 'Code incorrect.' });
    expect((await request(app).post('/api/account/verify').send({ email, code })).body.error).toContain('demandes-en un nouveau');
    expect((await request(app).post('/api/account/code').send({ email })).status).toBe(204);
    expect((await request(app).post('/api/account/verify').send({ email, code: codeSentTo(outbox, email) })).status).toBe(200);
  }, 30000);

  test('le code et le mot de passe ne sont jamais rangés tels quels, ni le jeton de session', async () => {
    const email = newEmail();
    await request(app).post('/api/account').send({ email, password: PASSWORD });
    const code = codeSentTo(outbox, email);

    const { rows: [user] } = await pool.query(
      'SELECT u.password_hash, c.code_hash FROM users u JOIN email_codes c ON c.user_id = u.id WHERE u.email = $1',
      [email],
    );
    const res = await request(app).post('/api/account/verify').send({ email, code });
    const token = res.headers['set-cookie'][0].match(/^session=([^;]+)/)[1];
    const { rows: sessions } = await pool.query('SELECT 1 FROM sessions WHERE token_hash = $1', [token]);

    expect(user.password_hash.startsWith('scrypt$')).toBe(true);
    expect(user.password_hash).not.toContain(PASSWORD);
    expect(user.code_hash).not.toContain(code);
    expect(sessions).toHaveLength(0);
  });

  test('e-mail d\'un compte validé : 409 ; compte jamais validé : repris (nouveau mot de passe, nouveau code)', async () => {
    const validated = newEmail();
    await signedUpAgent(world, validated, PASSWORD);
    const abandoned = newEmail();
    await request(app).post('/api/account').send({ email: abandoned, password: 'un mot de passe oublié' });

    expect((await request(app).post('/api/account').send({ email: validated, password: PASSWORD })).status).toBe(409);
    expect((await request(app).post('/api/account').send({ email: abandoned, password: PASSWORD })).status).toBe(202);
    await request(app).post('/api/account/verify').send({ email: abandoned, code: codeSentTo(outbox, abandoned) });
    expect((await request(app).post('/api/session').send({ email: abandoned, password: PASSWORD })).status).toBe(200);
  });

  test('mot de passe trop court : 400, aucun e-mail envoyé', async () => {
    const email = newEmail();

    expect((await request(app).post('/api/account').send({ email, password: 'court' })).status).toBe(400);
    expect(outbox.latestTo(email)).toBeUndefined();
  });

  test('renvoyer un code : 5 fois en 15 minutes au plus (429 ensuite)', async () => {
    const email = newEmail();
    await request(app).post('/api/account').send({ email, password: PASSWORD });

    const statuses = [];
    for (let attempt = 1; attempt <= 6; attempt++) statuses.push((await request(app).post('/api/account/code').send({ email })).status);

    expect(statuses).toEqual([204, 204, 204, 204, 204, 429]);
  });
});

describe('se connecter, se déconnecter, supprimer son compte', () => {
  test('sans session : personne de connecté (ce n\'est pas une erreur)', async () => {
    expect((await request(app).get('/api/session')).body).toEqual({ user: null });
  });

  test('se déconnecter puis se reconnecter', async () => {
    const email = newEmail();
    const agent = await signedUpAgent(world, email, PASSWORD);

    expect((await agent.delete('/api/session')).status).toBe(204);
    expect((await agent.get('/api/session')).body).toEqual({ user: null });

    const res = await agent.post('/api/session').send({ email: email.toUpperCase(), password: PASSWORD });
    expect(res.status).toBe(200);
    expect((await agent.get('/api/session')).body).toEqual({ user: { email, hasPassword: true } });
  });

  test('se connecter à un compte pas encore validé : 202, un nouveau code, pas de session', async () => {
    const agent = request.agent(app);
    const email = newEmail();
    await agent.post('/api/account').send({ email, password: PASSWORD });
    const firstCode = codeSentTo(outbox, email);

    const res = await agent.post('/api/session').send({ email, password: PASSWORD });

    expect(res.status).toBe(202);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(outbox.latestTo(email).subject).not.toBe(`Ton code : ${firstCode}`);
  });

  test('mauvais mot de passe : 401 ; après 10 échecs, 429 même avec le bon', async () => {
    const email = newEmail();
    await signedUpAgent(world, email, PASSWORD);

    const wrong = await request(app).post('/api/session').send({ email, password: 'pas le bon mot' });
    expect(wrong.status).toBe(401);
    expect(wrong.body).toEqual({ error: 'E-mail ou mot de passe incorrect.' });

    for (let attempt = 1; attempt < 10; attempt++) {
      await request(app).post('/api/session').send({ email, password: 'pas le bon mot' });
    }
    expect((await request(app).post('/api/session').send({ email, password: PASSWORD })).status).toBe(429);
  }, 30000);

  test('des essais envoyés tous en même temps : 10 au plus sont vérifiés, les autres attendent (429)', async () => {
    const email = newEmail();
    await signedUpAgent(world, email, PASSWORD);

    const responses = await Promise.all(Array.from({ length: 15 }, () => request(app).post('/api/session').send({ email, password: 'pas le bon mot' })));
    const statuses = responses.map((res) => res.status);

    expect(statuses.filter((status) => status === 401)).toHaveLength(10);
    expect(statuses.filter((status) => status === 429)).toHaveLength(5);
  }, 30000);

  test('une session expirée ne vaut plus rien (ni « qui est connecté », ni « à moi »)', async () => {
    const email = newEmail();
    const agent = await signedUpAgent(world, email, PASSWORD);

    await pool.query(
      `UPDATE sessions SET expires_at = now() - interval '1 day'
       WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email],
    );

    expect((await agent.get('/api/session')).body).toEqual({ user: null });
    expect((await agent.get('/api/me/library')).status).toBe(401);
  });

  test('supprimer son compte : mot de passe exigé, puis le compte et ses sessions disparaissent', async () => {
    const email = newEmail();
    const agent = await signedUpAgent(world, email, PASSWORD);

    expect((await agent.delete('/api/account').send({ password: 'pas le bon mot' })).status).toBe(401);
    expect((await agent.delete('/api/account').send({ password: PASSWORD })).status).toBe(204);

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    expect(rows).toHaveLength(0);
    expect((await agent.get('/api/session')).body).toEqual({ user: null });
    expect((await request(app).post('/api/session').send({ email, password: PASSWORD })).status).toBe(401);
  });

  test('supprimer un compte sans être connecté : 401', async () => {
    expect((await request(app).delete('/api/account').send({ password: PASSWORD })).status).toBe(401);
  });

  test('le reste de l\'API n\'est pas touché par le « no-store » des comptes', async () => {
    const res = await request(app).get('/api/overview/bible');

    expect(res.headers['cache-control']).not.toBe('no-store');
  });
});

describe('sans service d\'envoi d\'e-mails (en ligne, avant le nom de domaine)', () => {
  test('créer un compte par e-mail : 503, avec un message qui le dit (le site propose Google s\'il est là)', async () => {
    const { makeApp } = await import('../../src/app.js');
    const res = await request(makeApp({ emailSender: null })).post('/api/account').send({ email: newEmail(), password: PASSWORD });

    expect(res.status).toBe(503);
    expect(res.body.error).toContain('pas encore ouverte');
  });
});
