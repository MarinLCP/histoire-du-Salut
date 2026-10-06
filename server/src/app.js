// Point d'assemblage ("composition root") : le SEUL fichier qui relie toutes les couches.
// On y choisit les vraies implémentations (PostgreSQL) et on les injecte dans les use cases,
// puis les use cases dans l'app Express. Les tests unitaires, eux, injectent de faux repositories.
//
//   http/ (Express)  ──>  application/ (use cases)  ──>  domain/ (règles métier)
//   infrastructure/ (PostgreSQL)  ──implémente──>  domain/PassageRepository.js, domain/BibleRepository.js,
//                                                  domain/ParallelRepository.js, domain/AccountRepository.js
//                                                  (et scrypt pour le hachage des mots de passe)
//
// Les flèches pointent toujours vers le domaine : il ne dépend de rien (règle de dépendance).

import { pool, pingDatabase } from './infrastructure/db.js';
import { createPostgresPassageRepository } from './infrastructure/postgresPassageRepository.js';
import { createPostgresBibleRepository } from './infrastructure/postgresBibleRepository.js';
import { createPostgresParallelRepository } from './infrastructure/postgresParallelRepository.js';
import { createPostgresUserRepository, createPostgresSessionRepository } from './infrastructure/postgresAccountRepository.js';
import { createScryptPasswordHasher } from './infrastructure/scryptPasswordHasher.js';
import { makeGetPassage } from './application/getPassage.js';
import { makeGetTimeline } from './application/getTimeline.js';
import { makeReadBible } from './application/readBible.js';
import { makeFindChapter } from './application/findChapter.js';
import { makeGetHistoryOverview } from './application/getHistoryOverview.js';
import { makeGetBibleOverview } from './application/getBibleOverview.js';
import { makeGetParallels } from './application/getParallels.js';
import { makeCreateAccount } from './application/createAccount.js';
import { makeLogIn } from './application/logIn.js';
import { makeLogOut } from './application/logOut.js';
import { makeGetCurrentUser } from './application/getCurrentUser.js';
import { makeDeleteAccount } from './application/deleteAccount.js';
import { createApp } from './http/createApp.js';
import { fileURLToPath } from 'node:url';

const passageRepository = createPostgresPassageRepository(pool);
const bibleRepository = createPostgresBibleRepository(pool);
const parallelRepository = createPostgresParallelRepository(pool);
const accountDependencies = {
  userRepository: createPostgresUserRepository(pool),
  sessionRepository: createPostgresSessionRepository(pool),
  passwordHasher: createScryptPasswordHasher(),
};

const app = createApp({
  getPassage: makeGetPassage(passageRepository),
  getTimeline: makeGetTimeline(passageRepository),
  readBible: makeReadBible(bibleRepository),
  findChapter: makeFindChapter(bibleRepository),
  getHistoryOverview: makeGetHistoryOverview(passageRepository),
  getBibleOverview: makeGetBibleOverview(bibleRepository),
  getParallels: makeGetParallels(parallelRepository),
  accounts: {
    createAccount: makeCreateAccount(accountDependencies),
    logIn: makeLogIn(accountDependencies),
    logOut: makeLogOut(accountDependencies.sessionRepository),
    getCurrentUser: makeGetCurrentUser(accountDependencies.sessionRepository),
    deleteAccount: makeDeleteAccount(accountDependencies),
  },
  // En ligne (Render : NODE_ENV=production), le site est en HTTPS : le cookie de session n'y voyage que chiffré
  secureCookies: process.env.NODE_ENV === 'production',
  pingDatabase,
  // Le site React une fois construit (cd client && npm run build)
  clientBuildDirectory: fileURLToPath(new URL('../../client/dist', import.meta.url)),
});

export default app;
