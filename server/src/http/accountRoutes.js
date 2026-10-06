// Les adresses des comptes : créer, se connecter, se déconnecter, qui est connecté, supprimer son compte.
// Ce fichier traduit HTTP (corps JSON, cookie, codes) en appels de use cases : aucune règle métier ici.
// Corps JSON et « jamais en cache » : réglés une fois pour toutes les adresses privées (privateApi.js).

import express from 'express';
import { Email } from '../domain/Email.js';
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

  router.get('/session', async (req, res) => {
    res.json({ user: await getCurrentUser(readSessionToken(req)) });
  });

  router.post('/account', async (req, res) => {
    const { user, token } = await createAccount(req.body ?? {});
    setSessionCookie(res, token, secureCookies);
    res.status(201).json({ user });
  });

  router.post('/session', async (req, res) => {
    const key = Email.normalize(req.body?.email);
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

// Chaque essai compte AVANT la vérification (qui prend ~100 ms) : sinon, des milliers d'essais envoyés en
// même temps passeraient tous avant que le premier échec soit compté. Une réussite remet le compteur à zéro.
async function logInCounting(limiter, key, attempt) {
  limiter.recordFailure(key);
  const result = await attempt();
  limiter.reset(key);
  return result;
}
