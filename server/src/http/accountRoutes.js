// Les adresses des comptes : créer, se connecter, se déconnecter, qui est connecté, supprimer son compte.
// Ce fichier traduit HTTP (corps JSON, cookie, codes) en appels de use cases : aucune règle métier ici.
// Cache-Control: no-store : une réponse qui dépend du lecteur connecté ne doit jamais être gardée en cache
// (ni par le navigateur, ni par un intermédiaire comme Cloudflare).

import express from 'express';
import { UnauthorizedError } from '../domain/errors.js';
import { readSessionToken, setSessionCookie, clearSessionCookie } from './sessionCookie.js';
import { createAttemptLimiter } from './attemptLimiter.js';

const LOGIN_LIMIT = { maxFailures: 10, windowMs: 15 * 60 * 1000 };

/**
 * @param {object} accounts - les use cases des comptes (application/)
 * @param {boolean} secureCookies - vrai en ligne (HTTPS)
 */
export function accountRoutes({ createAccount, logIn, logOut, getCurrentUser, deleteAccount }, secureCookies) {
  const router = express.Router();
  const loginLimiter = createAttemptLimiter(LOGIN_LIMIT);

  // Seulement pour les adresses des comptes : le reste de l'API (Bible, frise...) garde son cache
  router.use(['/account', '/session'], express.json({ limit: '10kb' }), (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.get('/session', async (req, res) => {
    res.json({ user: await getCurrentUser(readSessionToken(req)) });
  });

  router.post('/account', async (req, res) => {
    const { user, token } = await createAccount(req.body ?? {});
    setSessionCookie(res, token, secureCookies);
    res.status(201).json({ user });
  });

  router.post('/session', async (req, res) => {
    const key = String(req.body?.email ?? '').trim().toLowerCase();
    if (loginLimiter.isBlocked(key)) {
      return res.status(429).json({ error: 'Trop de tentatives. Réessaie dans quelques minutes.' });
    }
    const { user, token } = await logInCounting(loginLimiter, key, () => logIn(req.body ?? {}));
    setSessionCookie(res, token, secureCookies);
    res.json({ user });
  });

  router.delete('/session', async (req, res) => {
    await logOut(readSessionToken(req));
    clearSessionCookie(res, secureCookies);
    res.status(204).end();
  });

  router.delete('/account', async (req, res) => {
    await deleteAccount(readSessionToken(req), req.body ?? {});
    clearSessionCookie(res, secureCookies);
    res.status(204).end();
  });

  return router;
}

// Un échec de connexion compte pour la limite ; une réussite la remet à zéro
async function logInCounting(limiter, key, attempt) {
  try {
    const result = await attempt();
    limiter.reset(key);
    return result;
  } catch (error) {
    if (error instanceof UnauthorizedError) limiter.recordFailure(key);
    throw error;
  }
}
