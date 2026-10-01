// Point d'assemblage ("composition root") : le SEUL fichier qui relie toutes les couches.
// On y choisit les vraies implémentations (PostgreSQL) et on les injecte dans les use cases,
// puis les use cases dans l'app Express. Les tests unitaires, eux, injectent de faux repositories.
//
//   http/ (Express)  ──>  application/ (use cases)  ──>  domain/ (règles métier)
//   infrastructure/ (PostgreSQL)  ──implémente──>  domain/PassageRepository.js
//
// Les flèches pointent toujours vers le domaine : il ne dépend de rien (règle de dépendance).

import { pool, pingDatabase } from './infrastructure/db.js';
import { createPostgresPassageRepository } from './infrastructure/postgresPassageRepository.js';
import { makeGetPassage } from './application/getPassage.js';
import { makeGetTimeline } from './application/getTimeline.js';
import { createApp } from './http/createApp.js';
import { fileURLToPath } from 'node:url';

const passageRepository = createPostgresPassageRepository(pool);

const app = createApp({
  getPassage: makeGetPassage(passageRepository),
  getTimeline: makeGetTimeline(passageRepository),
  pingDatabase,
  // Le site React une fois construit (cd client && npm run build)
  clientBuildDirectory: fileURLToPath(new URL('../../client/dist', import.meta.url)),
});

export default app;
