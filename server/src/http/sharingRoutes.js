// Les adresses du partage de progression : /api/me/sharing et /api/me/profile (lecteur connecté), et
// /api/progress/:token (public : ce que montre un lien de partage). Aucune règle métier ici.
// Réponses jamais en cache (no-store) : elles suivent la lecture.

import express from 'express';
import { readSessionToken } from './sessionCookie.js';

export function sharingRoutes(sharing) {
  const router = express.Router();
  router.use(['/me/sharing', '/me/profile', '/progress'], express.json({ limit: '10kb' }), (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.get('/me/sharing', async (req, res) => res.json(await sharing.getSharing(readSessionToken(req))));
  router.post('/me/sharing', async (req, res) => res.json(await sharing.openShare(readSessionToken(req))));
  router.delete('/me/sharing', async (req, res) => {
    await sharing.closeShare(readSessionToken(req));
    res.status(204).end();
  });
  router.put('/me/profile', async (req, res) => {
    await sharing.setDisplayName(readSessionToken(req), req.body);
    res.status(204).end();
  });
  router.get('/progress/:token', async (req, res) => res.json(await sharing.getProgress(req.params.token)));

  return router;
}
