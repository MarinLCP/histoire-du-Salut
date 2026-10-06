// Règles du code de validation envoyé par e-mail : 6 chiffres, 15 minutes, et le message envoyé.
// Partagé par « créer un compte », « se connecter » (compte pas encore validé) et « renvoyer le code ».

import { UnavailableError } from '../domain/errors.js';

export const CODE_MINUTES = 15;

// La réponse quand il faut d'abord valider l'e-mail (aucune session n'est ouverte)
export const verificationNeeded = (email) => ({ verificationNeeded: true, email });

/**
 * Crée un nouveau code pour ce lecteur et le lui envoie.
 * @param {{ emailCodeRepository: import('../domain/AccountRepository.js').EmailCodeRepository,
 *   emailSender: import('../domain/AccountRepository.js').EmailSender | null }} dependencies
 *   - emailSender null : aucun service d'envoi branché (en ligne, avant le nom de domaine)
 * @param {{ id: number, email: string }} user
 */
export async function sendVerificationCode({ emailCodeRepository, emailSender }, user) {
  requireEmailSender(emailSender);
  const code = await emailCodeRepository.create(user.id, CODE_MINUTES);
  await emailSender.send({
    to: user.email,
    subject: `Ton code : ${code}`,
    text: `Voici ton code pour valider ton adresse sur L'histoire d'un Salut : ${code}\n\n`
      + `Il est valable ${CODE_MINUTES} minutes. Si tu n'as pas demandé ce code, ignore ce message.`,
  });
}

// Avant de créer quoi que ce soit : pas d'envoi possible = pas de compte par e-mail pour le moment
export function requireEmailSender(emailSender) {
  if (!emailSender) {
    throw new UnavailableError('La création de compte par e-mail arrive bientôt : utilise « Continuer avec Google ».');
  }
}
