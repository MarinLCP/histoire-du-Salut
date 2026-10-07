// « Continuer avec Google » : l'aller vers Google (/api/auth/google) et le retour (/api/auth/google/callback).
// Ce fichier gère le protocole HTTP de la connexion (state, PKCE, nonce, redirections, cookies) ; la règle des
// comptes (relier, créer, vol de compte évité) est dans le use case signInWithGoogle.
// - state : un nombre au hasard, gardé dans un cookie de ce navigateur ET ici ; au retour, les deux doivent
//   correspondre (personne ne peut nous faire avaler une connexion qui n'est pas la tienne) ;
// - PKCE : un secret (code_verifier) gardé ici ; Google n'échange le code que contre ce secret ;
// - nonce : glissé dans la carte d'identité par Google ; il doit être celui envoyé à l'aller.
// Les connexions en cours sont gardées en mémoire 10 minutes (un seul serveur).

import express from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { cookieOptions, readCookie, setSessionCookie } from './sessionCookie.js';

const STATE_COOKIE = 'oauth_state';
const COOKIE_PATH = '/api/auth/google';
const PENDING_MS = 10 * 60 * 1000;
const MAX_PENDING = 10000;

/**
 * @param {{ googleIdentity: import('../domain/AccountRepository.js').GoogleIdentity,
 *   signInWithGoogle: (claims: object) => Promise<{ token: string }> }} google
 * @param {boolean} secureCookies
 * @param {() => number} [now] - l'horloge (tests)
 */
export function googleRoutes({ googleIdentity, signInWithGoogle }, secureCookies, now = Date.now) {
  const router = express.Router();
  const pending = createPendingSignIns(now);
  const stateCookie = cookieOptions(secureCookies, COOKIE_PATH);

  router.get('/auth/google', (req, res) => {
    const state = randomText(18);
    const codeVerifier = randomText(32);
    const nonce = randomText(18);
    pending.add(state, { codeVerifier, nonce });
    res.cookie(STATE_COOKIE, state, { ...stateCookie, maxAge: PENDING_MS });
    res.redirect(googleIdentity.authorizationUrl({ state, codeChallenge: challengeOf(codeVerifier), nonce }));
  });

  router.get('/auth/google/callback', async (req, res) => {
    const state = String(req.query.state ?? '');
    const saved = pending.take(state);
    res.clearCookie(STATE_COOKIE, stateCookie);
    // Annulé chez Google, retour sans code, ou retour qui ne correspond pas à un aller de CE navigateur
    if (!saved || readCookie(req, STATE_COOKIE) !== state || !req.query.code) return res.redirect('/');

    try {
      const claims = await googleIdentity.exchangeCode({ code: String(req.query.code), ...saved });
      const { token } = await signInWithGoogle(claims);
      setSessionCookie(res, token, secureCookies);
      res.redirect('/');
    } catch (error) {
      console.error('Connexion Google impossible :', error.message);
      res.redirect('/?connexion=echec');
    }
  });

  return router;
}

// Les connexions en cours : state -> { codeVerifier, nonce }, valables PENDING_MS, utilisables une seule fois
function createPendingSignIns(now) {
  const signIns = new Map();
  return {
    add(state, secrets) {
      if (signIns.size >= MAX_PENDING) forgetExpired(signIns, now);
      signIns.set(state, { ...secrets, expiresAt: now() + PENDING_MS });
    },
    take(state) {
      const saved = signIns.get(state);
      signIns.delete(state);
      return saved && saved.expiresAt > now() ? saved : null;
    },
  };
}

function forgetExpired(signIns, now) {
  for (const [state, saved] of signIns) {
    if (saved.expiresAt <= now()) signIns.delete(state);
  }
}

function randomText(bytes) {
  return randomBytes(bytes).toString('base64url');
}

// PKCE (méthode S256) : l'empreinte SHA-256 du secret, en base64url
function challengeOf(codeVerifier) {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}
