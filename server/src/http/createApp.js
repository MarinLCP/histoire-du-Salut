// Construit l'app Express à partir de ce qu'on lui DONNE (injection de dépendances) :
// les use cases, la vérification de la base, et le dossier du site React construit.
// Ce fichier ne connaît ni PostgreSQL ni le SQL : il relie des adresses HTTP à des use cases.

import express from 'express';
import { join } from 'node:path';
import { errorHandler } from './errorHandler.js';

/**
 * @param {object} dependencies
 * @param {(slug: string) => Promise<object>} dependencies.getPassage
 * @param {(query: object) => Promise<object>} dependencies.getTimeline
 * @param {() => Promise<object[]>} dependencies.listBooks
 * @param {(query: object) => Promise<object>} dependencies.readBible
 * @param {(bookCode: string, label: string) => Promise<object>} dependencies.findChapter
 * @param {() => Promise<void>} dependencies.pingDatabase
 * @param {string} dependencies.clientBuildDirectory - le site React construit (client/dist)
 */
export function createApp({ getPassage, getTimeline, listBooks, readBible, findChapter, pingDatabase, clientBuildDirectory }) {
  const app = express();

  app.get('/api/health', healthHandler(pingDatabase));

  // Un passage avec ses versets (ex. /api/passages/creation)
  app.get('/api/passages/:slug', async (req, res) => {
    res.json(await getPassage(req.params.slug));
  });

  // Les passages qui suivent la position `after` (ex. /api/timeline?after=3&limit=5)
  app.get('/api/timeline', async (req, res) => {
    res.json(await getTimeline(req.query));
  });

  // La Bible entière : les livres, puis les chapitres en continu (ex. /api/bible?after=0&limit=2)
  app.get('/api/books', async (req, res) => {
    res.json(await listBooks());
  });
  app.get('/api/bible', async (req, res) => {
    res.json(await readBible(req.query));
  });
  // La position d'un chapitre, pour ouvrir la Bible à cet endroit (ex. /api/books/Gn/chapters/3)
  app.get('/api/books/:code/chapters/:chapter', async (req, res) => {
    res.json(await findChapter(req.params.code, req.params.chapter));
  });

  serveClient(app, clientBuildDirectory);

  // En dernier : traduit les erreurs de toutes les routes au-dessus (introuvable → 404...)
  app.use(errorHandler);

  return app;
}

// L'état de santé du serveur ET de la base. Render l'appelle régulièrement :
// une réponse autre que 2xx lui signale un problème.
function healthHandler(pingDatabase) {
  return async (req, res) => {
    try {
      await pingDatabase();
      res.json({ status: 'ok', database: 'ok' });
    } catch {
      // 503 = "service indisponible" : le serveur tourne, mais il ne peut pas faire son travail
      res.status(503).json({ status: 'error', database: 'unreachable' });
    }
  };
}

// En production, le même serveur envoie aussi le site : le site et l'API ont la même adresse
// (pas de CORS, un seul service à héberger). Les liens partagés (/?passage=...) arrivent sur "/".
// En dev, ce dossier n'existe pas forcément : c'est Vite qui sert le site (port 5173).
function serveClient(app, clientBuildDirectory) {
  // Les fichiers de assets/ ont un nom qui change à chaque build (ex. index-CUDavFl6.js) :
  // le navigateur peut les garder en cache un an sans jamais redemander
  // fallthrough: false : un fichier absent de assets/ répond 404 tout de suite, sans être recherché deux fois
  app.use(
    '/assets',
    express.static(join(clientBuildDirectory, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }),
  );
  app.use(express.static(clientBuildDirectory));

  // « SPA fallback » : une adresse du site qui n'est pas un fichier (ex. /bible, ouverte directement ou
  // rafraîchie) renvoie index.html ; c'est ensuite React (le routeur) qui affiche la bonne page.
  // Les adresses de l'API ne sont pas concernées : une route API inconnue doit rester une vraie 404.
  app.get('/{*address}', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    // Pas de site construit (en dev, c'est Vite qui sert le site) : on laisse Express répondre 404
    res.sendFile(join(clientBuildDirectory, 'index.html'), (error) => { if (error) next(); });
  });
}
