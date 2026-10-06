// Construit l'app Express à partir de ce qu'on lui DONNE (injection de dépendances) :
// les use cases, la vérification de la base, et le dossier du site React construit.
// Ce fichier ne connaît ni PostgreSQL ni le SQL : il relie des adresses HTTP à des use cases.

import express from 'express';
import { join } from 'node:path';
import { errorHandler } from './errorHandler.js';
import { accountRoutes } from './accountRoutes.js';
import { libraryRoutes } from './libraryRoutes.js';
import { sharingRoutes } from './sharingRoutes.js';
import { googleRoutes } from './googleRoutes.js';
import { PRIVATE_PATHS, LIBRARY_JSON, privateApi } from './privateApi.js';

/**
 * @param {object} dependencies
 * @param {(slug: string) => Promise<object>} dependencies.getPassage
 * @param {(query: object) => Promise<object>} dependencies.getTimeline
 * @param {(query: object) => Promise<object>} dependencies.readBible
 * @param {(bookCode: string, label: string) => Promise<object>} dependencies.findChapter
 * @param {() => Promise<object[]>} dependencies.getHistoryOverview
 * @param {() => Promise<object[]>} dependencies.getBibleOverview
 * @param {(verse: { book: string, chapter: string, verse: string }, query: object) => Promise<object>} dependencies.getParallels
 * @param {object} [dependencies.accounts] - les use cases des comptes (voir accountRoutes.js)
 * @param {object} [dependencies.google] - « Continuer avec Google » (voir googleRoutes.js) ; absent : pas de Google
 * @param {object} [dependencies.library] - les use cases de la bibliothèque du lecteur (voir libraryRoutes.js)
 * @param {object} [dependencies.sharing] - les use cases du partage de progression (voir sharingRoutes.js)
 * @param {boolean} [dependencies.secureCookies] - cookies seulement en HTTPS (vrai en ligne)
 * @param {{ latestTo: (to: string) => object | undefined }} [dependencies.testOutbox] - la boîte d'envoi de test
 *   (parcours e2e) : jamais en ligne
 * @param {() => Promise<void>} dependencies.pingDatabase
 * @param {string} dependencies.clientBuildDirectory - le site React construit (client/dist)
 */
export function createApp({
  getPassage, getTimeline, readBible, findChapter, getHistoryOverview, getBibleOverview, getParallels,
  accounts, google, library, sharing, secureCookies = false, testOutbox, pingDatabase, clientBuildDirectory,
}) {
  const app = express();

  app.get('/api/health', healthHandler(pingDatabase));

  // Les adresses propres au lecteur : pas de cache, corps JSON limité (privateApi.js). La bibliothèque
  // envoyée d'un coup est lue d'abord, avec sa limite plus grande (express.json ne relit pas un corps déjà lu)
  app.use('/api/me/library', LIBRARY_JSON);
  app.use(PRIVATE_PATHS, privateApi());
  // Les comptes : /api/account (créer, supprimer) et /api/session (se connecter, se déconnecter, qui est connecté)
  if (accounts) app.use('/api', accountRoutes(accounts, secureCookies));
  // Se connecter avec Google : /api/auth/google (aller) et /api/auth/google/callback (retour)
  if (google) app.use('/api', googleRoutes(google, secureCookies));
  // Ce que le lecteur connecté garde dans son compte : /api/me/library, /api/me/notes/:key...
  if (library) app.use('/api/me', libraryRoutes(library));
  // Partager où on en est : le lien (/api/me/sharing), et ce que montre un lien (/api/progress/:token)
  if (sharing) app.use('/api', sharingRoutes(sharing));
  // Parcours e2e seulement : le dernier e-mail envoyé à une adresse (pour lire le code)
  if (testOutbox) {
    app.get('/api/test/emails/latest', (req, res) => {
      const message = testOutbox.latestTo(String(req.query.to));
      if (!message) return res.status(404).json({ error: 'Aucun e-mail.' });
      res.json(message);
    });
  }

  // Un passage avec ses versets (ex. /api/passages/creation)
  app.get('/api/passages/:slug', async (req, res) => {
    res.json(await getPassage(req.params.slug));
  });

  // Les passages qui suivent la position `after` (ex. /api/timeline?after=3&limit=5)
  app.get('/api/timeline', async (req, res) => {
    res.json(await getTimeline(req.query));
  });

  // La Bible entière : les chapitres en continu (ex. /api/bible?after=0&limit=2)
  app.get('/api/bible', async (req, res) => {
    res.json(await readBible(req.query));
  });
  // La position d'un chapitre, pour ouvrir la Bible à cet endroit (ex. /api/books/Gn/chapters/3)
  app.get('/api/books/:code/chapters/:chapter', async (req, res) => {
    res.json(await findChapter(req.params.code, req.params.chapter));
  });

  // Les parallèles d'un verset, les plus votés d'abord (ex. /api/books/Mt/chapters/11/verses/14/parallels?after=10)
  app.get('/api/books/:code/chapters/:chapter/verses/:verse/parallels', async (req, res) => {
    const { code, chapter, verse } = req.params;
    res.json(await getParallels({ book: code, chapter, verse }, req.query));
  });

  // La vue d'ensemble de la frise, sans texte : un arbre par mode
  app.get('/api/overview/history', async (req, res) => {
    res.json(await getHistoryOverview());
  });
  app.get('/api/overview/bible', async (req, res) => {
    res.json(await getBibleOverview());
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
