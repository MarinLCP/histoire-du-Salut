// Tests de « Continuer avec Google » de bout en bout (supertest + base de dev), avec un FAUX Google (on ne
// peut pas appeler le vrai) qui vérifie quand même le PKCE et le nonce envoyés à l'aller.
// Comptes de test en @exemple.test, effacés à la fin.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { pool } from '../../src/infrastructure/db.js';
import { makeApp } from '../../src/app.js';
import { appWithOutbox, signedUpAgent } from './helpers/accounts.js';

const TEST_DOMAIN = '@exemple.test';
const newEmail = () => `google-${Math.random().toString(36).slice(2)}${TEST_DOMAIN}`;
const newSub = () => `sub-${Math.random().toString(36).slice(2)}`;

// Le faux Google : ce qu'il dira du lecteur pour chaque code (claimsByCode)
function fakeGoogle(claimsByCode) {
  let lastRequest;
  return {
    authorizationUrl(googleRequest) {
      lastRequest = googleRequest;
      return `https://accounts.google.test/auth?state=${googleRequest.state}`;
    },
    async exchangeCode({ code, codeVerifier, nonce }) {
      // PKCE : le secret doit correspondre à l'empreinte envoyée à l'aller ; le nonce, à celui de l'aller
      if (createHash('sha256').update(codeVerifier).digest('base64url') !== lastRequest.codeChallenge) throw new Error('PKCE');
      if (nonce !== lastRequest.nonce) throw new Error('nonce');
      return claimsByCode[code];
    },
  };
}

const claims = (email, sub, extra = {}) => ({ sub, email, emailVerified: true, givenName: 'Marin', ...extra });

// Un navigateur qui fait l'aller-retour chez Google ; renvoie la réponse du retour
async function signInWithGoogle(agent, code) {
  const start = await agent.get('/api/auth/google');
  const state = new URL(start.headers.location).searchParams.get('state');
  return agent.get(`/api/auth/google/callback?code=${code}&state=${state}`);
}

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`google-%${TEST_DOMAIN}`]);
  await pool.end();
});

describe('Continuer avec Google', () => {
  test('l\'aller : vers Google, avec un cookie state httpOnly ; les options disent que Google est là', async () => {
    const app = makeApp({ emailSender: null, googleIdentity: fakeGoogle({}) });

    const res = await request(app).get('/api/auth/google');

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/^https:\/\/accounts\.google\.test\/auth\?state=/);
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^oauth_state=/);
    expect(cookie).toContain('Path=/api/auth/google');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect((await request(app).get('/api/auth/options')).body).toEqual({ google: true, emailSignUp: false });
  });

  test('un nouveau lecteur : un compte créé (sans mot de passe, validé), connecté, avec son prénom', async () => {
    const email = newEmail();
    const app = makeApp({ emailSender: null, googleIdentity: fakeGoogle({ 'code-1': claims(email, newSub()) }) });
    const agent = request.agent(app);

    const res = await signInWithGoogle(agent, 'code-1');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
    expect((await agent.get('/api/session')).body).toEqual({ user: { email, hasPassword: false } });
    const { rows: [user] } = await pool.query('SELECT given_name, email_verified_at FROM users WHERE email = $1', [email]);
    expect(user.given_name).toBe('Marin');
    expect(user.email_verified_at).not.toBeNull();
  });

  test('revenir avec Google : le même compte (retrouvé par son identifiant Google)', async () => {
    const email = newEmail();
    const sub = newSub();
    const app = makeApp({ emailSender: null, googleIdentity: fakeGoogle({ a: claims(email, sub), b: claims(email, sub) }) });

    await signInWithGoogle(request.agent(app), 'a');
    await signInWithGoogle(request.agent(app), 'b');

    const { rows } = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    expect(rows).toHaveLength(1);
  });

  test('un compte e-mail déjà validé : relié à Google, il garde son mot de passe', async () => {
    const email = newEmail();
    const world = appWithOutbox({ googleIdentity: fakeGoogle({ c: claims(email, newSub()) }) });
    const { app } = world;
    await signedUpAgent(world, email, 'un mot de passe long');

    const agent = request.agent(app);
    await signInWithGoogle(agent, 'c');

    expect((await agent.get('/api/session')).body).toEqual({ user: { email, hasPassword: true } });
  });

  test('vol de compte évité : un compte jamais validé avec MON adresse perd le mot de passe de l\'inconnu', async () => {
    const email = newEmail();
    const { app } = appWithOutbox({ googleIdentity: fakeGoogle({ d: claims(email, newSub()) }) });
    await request(app).post('/api/account').send({ email, password: 'le mot de passe de l\'inconnu' });

    const agent = request.agent(app);
    await signInWithGoogle(agent, 'd');

    expect((await agent.get('/api/session')).body).toEqual({ user: { email, hasPassword: false } });
    expect((await request(app).post('/api/session').send({ email, password: 'le mot de passe de l\'inconnu' })).status).toBe(401);
  });

  test('un retour qui ne vient pas de CE navigateur (state inconnu) : refusé, pas de session', async () => {
    const app = makeApp({ emailSender: null, googleIdentity: fakeGoogle({ e: claims(newEmail(), newSub()) }) });
    const victim = request.agent(app);

    const res = await victim.get('/api/auth/google/callback?code=e&state=un-state-invente');

    expect(res.headers.location).toBe('/');
    expect((await victim.get('/api/session')).body).toEqual({ user: null });
  });

  test('une adresse que Google n\'a pas vérifiée : refusée', async () => {
    const app = makeApp({ emailSender: null, googleIdentity: fakeGoogle({ f: claims(newEmail(), newSub(), { emailVerified: false }) }) });
    const agent = request.agent(app);

    const res = await signInWithGoogle(agent, 'f');

    expect(res.headers.location).toBe('/?connexion=echec');
    expect((await agent.get('/api/session')).body).toEqual({ user: null });
  });

  test('supprimer un compte Google (sans mot de passe) : écrire SUPPRIMER pour confirmer', async () => {
    const email = newEmail();
    const app = makeApp({ emailSender: null, googleIdentity: fakeGoogle({ g: claims(email, newSub()) }) });
    const agent = request.agent(app);
    await signInWithGoogle(agent, 'g');

    expect((await agent.delete('/api/account').send({ confirmation: 'non' })).status).toBe(400);
    expect((await agent.delete('/api/account').send({ confirmation: 'supprimer' })).status).toBe(204);
    const { rows } = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    expect(rows).toHaveLength(0);
  });

  test('sans identifiants Google : pas de route Google, et les options le disent', async () => {
    const app = makeApp({ emailSender: null, googleIdentity: null });

    expect((await request(app).get('/api/auth/google')).status).toBe(404);
    expect((await request(app).get('/api/auth/options')).body).toEqual({ google: false, emailSignUp: false });
  });
});
