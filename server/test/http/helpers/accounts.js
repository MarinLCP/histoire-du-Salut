// Aide des tests d'API qui ont besoin de comptes : une app dont les e-mails restent dans une boîte de test
// lisible (rien n'est envoyé ni affiché), et un lecteur inscrit, validé par son code, connecté.

import request from 'supertest';
import { makeApp } from '../../../src/app.js';
import { createOutboxEmailSender } from '../../../src/infrastructure/emailSenders.js';

// googleIdentity : un faux Google, si le test en a besoin (sinon : pas de connexion Google)
export function appWithOutbox({ googleIdentity = null } = {}) {
  const outbox = createOutboxEmailSender(() => {});
  return { app: makeApp({ emailSender: outbox, testOutbox: outbox, googleIdentity }), outbox };
}

// Le code du dernier e-mail envoyé à cette adresse (il est dans le sujet : « Ton code : 123456 »)
export function codeSentTo(outbox, email) {
  return outbox.latestTo(email).subject.match(/\d{6}/)[0];
}

// Un lecteur inscrit et validé, connecté (agent : il garde son cookie de session)
export async function signedUpAgent({ app, outbox }, email, password) {
  const agent = request.agent(app);
  await agent.post('/api/account').send({ email, password });
  await agent.post('/api/account/verify').send({ email, code: codeSentTo(outbox, email) });
  return agent;
}
