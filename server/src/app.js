// Point d'assemblage ("composition root") : le SEUL fichier qui relie toutes les couches.
// On y choisit les vraies implémentations (PostgreSQL) et on les injecte dans les use cases,
// puis les use cases dans l'app Express. Les tests unitaires, eux, injectent de faux repositories.
//
//   http/ (Express)  ──>  application/ (use cases)  ──>  domain/ (règles métier)
//   infrastructure/ (PostgreSQL)  ──implémente──>  domain/PassageRepository.js, domain/BibleRepository.js,
//                                                  domain/ParallelRepository.js, domain/AccountRepository.js,
//                                                  domain/LibraryRepository.js, domain/SharingRepository.js
//                                                  (et scrypt pour le hachage des mots de passe)
//
// Les flèches pointent toujours vers le domaine : il ne dépend de rien (règle de dépendance).

import { pool, pingDatabase } from './infrastructure/db.js';
import { createPostgresPassageRepository } from './infrastructure/postgresPassageRepository.js';
import { createPostgresBibleRepository } from './infrastructure/postgresBibleRepository.js';
import { createPostgresParallelRepository } from './infrastructure/postgresParallelRepository.js';
import { createPostgresUserRepository, createPostgresSessionRepository } from './infrastructure/postgresAccountRepository.js';
import { createScryptPasswordHasher } from './infrastructure/scryptPasswordHasher.js';
import { createPostgresLibraryRepository } from './infrastructure/postgresLibraryRepository.js';
import { createPostgresSharingRepository } from './infrastructure/postgresSharingRepository.js';
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
import { makeVerifyEmail, makeResendEmailCode } from './application/verifyEmail.js';
import { createPostgresEmailCodeRepository } from './infrastructure/postgresEmailCodeRepository.js';
import { createBrevoEmailSender, createConsoleEmailSender, createOutboxEmailSender } from './infrastructure/emailSenders.js';
import { createGoogleIdentity } from './infrastructure/googleIdentity.js';
import { makeSignInWithGoogle } from './application/signInWithGoogle.js';
import { makeLibrary } from './application/library.js';
import { makeSharing } from './application/sharing.js';
import { createApp } from './http/createApp.js';
import { fileURLToPath } from 'node:url';

const passageRepository = createPostgresPassageRepository(pool);
const bibleRepository = createPostgresBibleRepository(pool);
const parallelRepository = createPostgresParallelRepository(pool);

// Qui envoie les e-mails (codes de validation) :
// - Brevo, dès que sa clé et l'adresse d'envoi (sur le nom de domaine du site) sont réglées ;
// - en ligne sans Brevo : personne (la création de compte par e-mail est fermée ; Google marche) ;
// - en local : le terminal du serveur ; ou, si EMAIL_OUTBOX=1 (parcours e2e), une boîte de test lisible.
export function chooseEmailSender(env) {
  if (env.BREVO_API_KEY && env.EMAIL_FROM) {
    return { emailSender: createBrevoEmailSender({ apiKey: env.BREVO_API_KEY, from: env.EMAIL_FROM }) };
  }
  if (env.NODE_ENV === 'production') return { emailSender: null };
  if (env.EMAIL_OUTBOX === '1') {
    const outbox = createOutboxEmailSender();
    return { emailSender: outbox, testOutbox: outbox };
  }
  return { emailSender: createConsoleEmailSender() };
}

// « Continuer avec Google », seulement si ses identifiants sont réglés (Google Cloud Console). APP_URL : l'adresse
// du site (en ligne : https://histoire-du-salut.onrender.com) ; l'adresse de retour doit être la même que chez Google.
export function chooseGoogleIdentity(env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
  const appUrl = env.APP_URL ?? 'http://localhost:5173';
  return createGoogleIdentity({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${appUrl}/api/auth/google/callback`,
  });
}

// L'app assemblée. Les tests peuvent choisir l'envoyeur d'e-mails (une boîte de test, pour lire les codes)
// et l'identité Google (une fausse).
export function makeApp({
  emailSender, testOutbox, googleIdentity = chooseGoogleIdentity(process.env),
} = { ...chooseEmailSender(process.env) }) {
  const accountDependencies = {
    userRepository: createPostgresUserRepository(pool),
    sessionRepository: createPostgresSessionRepository(pool),
    passwordHasher: createScryptPasswordHasher(),
    emailCodeRepository: createPostgresEmailCodeRepository(pool),
    emailSender,
  };

  return createApp({
    getPassage: makeGetPassage(passageRepository),
    getTimeline: makeGetTimeline(passageRepository),
    readBible: makeReadBible(bibleRepository),
    findChapter: makeFindChapter(bibleRepository),
    getHistoryOverview: makeGetHistoryOverview(passageRepository),
    getBibleOverview: makeGetBibleOverview(bibleRepository),
    getParallels: makeGetParallels(parallelRepository),
    accounts: {
      createAccount: makeCreateAccount(accountDependencies),
      verifyEmail: makeVerifyEmail(accountDependencies),
      resendEmailCode: makeResendEmailCode(accountDependencies),
      logIn: makeLogIn(accountDependencies),
      logOut: makeLogOut(accountDependencies.sessionRepository),
      getCurrentUser: makeGetCurrentUser(accountDependencies.sessionRepository),
      deleteAccount: makeDeleteAccount(accountDependencies),
      options: { google: googleIdentity !== null, emailSignUp: emailSender !== null },
    },
    google: googleIdentity && { googleIdentity, signInWithGoogle: makeSignInWithGoogle(accountDependencies) },
    library: makeLibrary({
      sessionRepository: accountDependencies.sessionRepository,
      libraryRepository: createPostgresLibraryRepository(pool),
    }),
    sharing: makeSharing({
      sessionRepository: accountDependencies.sessionRepository,
      sharingRepository: createPostgresSharingRepository(pool),
    }),
    // En ligne (Render : NODE_ENV=production), le site est en HTTPS : le cookie de session n'y voyage que chiffré
    secureCookies: process.env.NODE_ENV === 'production',
    testOutbox,
    pingDatabase,
    // Le site React une fois construit (cd client && npm run build)
    clientBuildDirectory: fileURLToPath(new URL('../../client/dist', import.meta.url)),
  });
}

export default makeApp();
