// Tests de l'identité Google (OpenID Connect) : l'adresse de connexion, et l'échange du code contre la carte
// d'identité du lecteur (avec ses vérifications). Google est remplacé par un faux fetch.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { createGoogleIdentity } from '../../src/infrastructure/googleIdentity.js';

const NOW = Date.UTC(2026, 9, 7);
const SETTINGS = { clientId: 'mon-client', clientSecret: 'mon-secret', redirectUri: 'http://localhost:5173/api/auth/google/callback', now: () => NOW };
const VALID = { iss: 'https://accounts.google.com', aud: 'mon-client', exp: NOW / 1000 + 600, sub: '1234', email: 'marin@gmail.com', email_verified: true, given_name: 'Marin', nonce: 'n-1' };

// Un faux ID token : en-tête.charge.signature (seule la charge est lue)
const idTokenOf = (payload) => ['e30', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'signature'].join('.');
const googleAnswers = (payload) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id_token: idTokenOf(payload) }))));

afterEach(() => vi.unstubAllGlobals());

describe('createGoogleIdentity', () => {
  test('l\'adresse de connexion : identifiant, retour, portée, state, nonce et PKCE (S256)', () => {
    const url = new URL(createGoogleIdentity(SETTINGS).authorizationUrl({ state: 's-1', codeChallenge: 'c-1', nonce: 'n-1' }));

    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: 'mon-client', redirect_uri: SETTINGS.redirectUri, response_type: 'code', scope: 'openid email profile',
      state: 's-1', nonce: 'n-1', code_challenge: 'c-1', code_challenge_method: 'S256',
    });
  });

  test('l\'échange du code : le secret et le code_verifier partent chez Google ; l\'identité revient', async () => {
    googleAnswers(VALID);

    const claims = await createGoogleIdentity(SETTINGS).exchangeCode({ code: 'code-1', codeVerifier: 'verif-1' });

    const body = new URLSearchParams(fetch.mock.calls[0][1].body);
    expect(fetch.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/token');
    expect(Object.fromEntries(body)).toMatchObject({ code: 'code-1', code_verifier: 'verif-1', client_secret: 'mon-secret', grant_type: 'authorization_code' });
    expect(claims).toEqual({ sub: '1234', email: 'marin@gmail.com', emailVerified: true, givenName: 'Marin', nonce: 'n-1' });
  });

  test.each([
    ['un autre émetteur', { iss: 'https://pirate.example' }, 'émetteur'],
    ['un autre site', { aud: 'un-autre-client' }, 'pas destiné à ce site'],
    ['expiré', { exp: NOW / 1000 - 1 }, 'expiré'],
  ])('une carte d\'identité refusée : %s', async (_, change, message) => {
    googleAnswers({ ...VALID, ...change });

    await expect(createGoogleIdentity(SETTINGS).exchangeCode({ code: 'c', codeVerifier: 'v' })).rejects.toThrow(message);
  });

  test('Google refuse l\'échange : une erreur', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));

    await expect(createGoogleIdentity(SETTINGS).exchangeCode({ code: 'c', codeVerifier: 'v' })).rejects.toThrow('erreur 400');
  });
});
