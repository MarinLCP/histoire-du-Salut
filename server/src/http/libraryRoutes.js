// Les adresses de la bibliothèque du lecteur connecté (/api/me/...) : notes privées, surlignages, marque-pages,
// positions de lecture.
// Traduit HTTP en appels de use cases (application/library.js) : aucune règle métier ici.
// Une note ou un surlignage est désigné par la référence de son verset, encodée dans l'adresse
// (ex. /api/me/notes/Gn%201%2C3). Corps JSON et « jamais en cache » : réglés dans createApp.js (privateApi.js).

import express from 'express';
import { readSessionToken } from './sessionCookie.js';

export function libraryRoutes(library) {
  const router = express.Router();
  // Une écriture : rien à renvoyer (204) ; action(token, req) appelle le use case
  const noContent = (action) => async (req, res) => {
    await action(readSessionToken(req), req);
    res.status(204).end();
  };

  router.get('/library', async (req, res) => res.json(await library.getLibrary(readSessionToken(req))));
  router.post('/library', async (req, res) => res.json(await library.mergeLibrary(readSessionToken(req), req.body)));
  router.put('/notes/:key', noContent((token, req) => library.saveNote(token, req.params.key, req.body)));
  router.delete('/notes/:key', noContent((token, req) => library.deleteNote(token, req.params.key)));
  router.put('/highlights/:key', noContent((token, req) => library.addHighlight(token, req.params.key)));
  router.delete('/highlights/:key', noContent((token, req) => library.removeHighlight(token, req.params.key)));
  router.put('/bookmarks/:mode', noContent((token, req) => library.saveBookmark(token, req.params.mode, req.body)));
  router.delete('/bookmarks/:mode', noContent((token, req) => library.removeBookmark(token, req.params.mode)));
  router.put('/readings/:mode', noContent((token, req) => library.saveReading(token, req.params.mode, req.body)));

  return router;
}
