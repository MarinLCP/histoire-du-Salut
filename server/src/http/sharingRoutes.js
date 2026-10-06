// Les adresses du partage de progression : /api/me/sharing (lecteur connecté), et
// /api/progress/:token (public : ce que montre un lien de partage). Aucune règle métier ici.
// Corps JSON et « jamais en cache » (elles suivent la lecture) : réglés dans createApp.js (privateApi.js).

import express from 'express';
import { readSessionToken } from './sessionCookie.js';

export function sharingRoutes(sharing) {
  const router = express.Router();

  router.get('/me/sharing', async (req, res) => res.json(await sharing.getSharing(readSessionToken(req))));
  router.post('/me/sharing', async (req, res) => res.json(await sharing.openShare(readSessionToken(req))));
  router.delete('/me/sharing', async (req, res) => {
    await sharing.closeShare(readSessionToken(req));
    res.status(204).end();
  });
  router.get('/progress/:token', async (req, res) => res.json(await sharing.getProgress(req.params.token)));

  return router;
}
