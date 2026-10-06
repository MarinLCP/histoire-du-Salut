// Implémentations du port EmailSender (domain/AccountRepository.js) :
// - Brevo (en ligne) : l'API d'envoi de Brevo, appelée avec fetch (pas de librairie) ;
// - le terminal (en local) : le message s'affiche dans le terminal du serveur, rien n'est envoyé ;
// - la boîte de test (parcours e2e) : comme le terminal, et les messages sont gardés en mémoire pour que
//   les tests puissent lire le code (jamais en ligne : voir chooseEmailSender, app.js).

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_NAME = 'L\'histoire d\'un Salut';

/** @param {{ apiKey: string, from: string }} settings - from : l'adresse d'envoi (sur le nom de domaine du site) */
export function createBrevoEmailSender({ apiKey, from }) {
  return {
    async send({ to, subject, text }) {
      const response = await fetch(BREVO_URL, {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { name: SENDER_NAME, email: from }, to: [{ email: to }], subject, textContent: text }),
      });
      if (!response.ok) throw new Error(`Envoi de l'e-mail refusé par Brevo (erreur ${response.status}).`);
    },
  };
}

export function createConsoleEmailSender(log = console.log) {
  return {
    async send({ to, subject, text }) {
      log(`[e-mail] À ${to} — ${subject}\n${text}`);
    },
  };
}

// latestTo(to) : le dernier message envoyé à cette adresse (ou undefined)
export function createOutboxEmailSender(log = console.log) {
  const sent = [];
  const consoleSender = createConsoleEmailSender(log);
  return {
    async send(message) {
      sent.push(message);
      await consoleSender.send(message);
    },
    latestTo: (to) => sent.findLast((message) => message.to === to),
  };
}
