// Les adresses des comptes : créer (puis valider l'e-mail par un code), se connecter, se déconnecter, qui est
// connecté, supprimer son compte. Une réponse 202 { verificationNeeded, email } : il faut d'abord le code.
// Ce fichier traduit HTTP (corps JSON, cookie, codes) en appels de use cases : aucune règle métier ici.
// Corps JSON et « jamais en cache » : réglés une fois pour toutes les adresses privées (privateApi.js).

import express from 'express';
import { Email } from '../domain/Email.js';
import { readSessionToken, setSessionCookie, clearSessionCookie } from './sessionCookie.js';
import { createAttemptLimiter } from './attemptLimiter.js';

const LOGIN_LIMIT = { maxFailures: 10, windowMs: 15 * 60 * 1000 };
// Renvoyer un code : 5 fois en 15 minutes au plus pour une adresse (pas de pluie d'e-mails)
const RESEND_LIMIT = { maxFailures: 5, windowMs: 15 * 60 * 1000 };
const TOO_MANY = { error: 'Trop de tentatives. Réessaie dans quelques minutes.' };

/**
 * @param {object} accounts - les use cases des comptes (application/)
 * @param {boolean} secureCookies - vrai en ligne (HTTPS)
 */
export function accountRoutes(accounts, secureCookies) {
  const { createAccount, verifyEmail, resendEmailCode, logIn, logOut, getCurrentUser, deleteAccount } = accounts;
  const router = express.Router();
  const loginLimiter = createAttemptLimiter(LOGIN_LIMIT);
  const resendLimiter = createAttemptLimiter(RESEND_LIMIT);
  // Session ouverte : le cookie, puis le lecteur ; sinon (202) ce qu'il faut faire d'abord
  const answer = (res, result) => {
    if (result.verificationNeeded) return res.status(202).json(result);
    setSessionCookie(res, result.token, secureCookies);
    res.json({ user: result.user });
  };

  // Ce que le site peut proposer : « Continuer avec Google », créer un compte par e-mail
  router.get('/auth/options', (req, res) => res.json(accounts.options));

  router.get('/session', async (req, res) => {
    res.json({ user: await getCurrentUser(readSessionToken(req)) });
  });

  router.post('/account', async (req, res) => answer(res, await createAccount(req.body ?? {})));
  router.post('/account/verify', async (req, res) => answer(res, await verifyEmail(req.body ?? {})));
  router.post('/account/code', async (req, res) => {
    const key = Email.normalize(req.body?.email);
    if (resendLimiter.isBlocked(key)) return res.status(429).json(TOO_MANY);
    resendLimiter.recordFailure(key);
    await resendEmailCode(req.body ?? {});
    res.status(204).end();
  });

  router.post('/session', async (req, res) => {
    const key = Email.normalize(req.body?.email);
    if (loginLimiter.isBlocked(key)) return res.status(429).json(TOO_MANY);
    answer(res, await logInCounting(loginLimiter, key, () => logIn(req.body ?? {})));
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
