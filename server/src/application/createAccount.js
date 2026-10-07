// Use case : créer un compte (e-mail + mot de passe). Le compte n'est pas encore validé : un code est envoyé
// par e-mail, et la session ne s'ouvre qu'une fois le code tapé (verifyEmail.js). Renvoie
// { verificationNeeded: true, email }.
// Un compte qui existe mais n'a jamais été validé peut être repris (nouveau mot de passe, nouveau code) :
// celui qui l'avait créé n'a pas prouvé que l'adresse était à lui.

import { Email } from '../domain/Email.js';
import { Password } from '../domain/Password.js';
import { ConflictError } from '../domain/errors.js';
import { sendVerificationCode, requireEmailSender, verificationNeeded } from './emailCodes.js';

const ACCOUNT_EXISTS = 'Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.';

/**
 * @param {{ userRepository, passwordHasher, emailCodeRepository, emailSender }} dependencies
 *   (ports : domain/AccountRepository.js ; emailSender null = pas d'envoi d'e-mails pour le moment)
 */
export function makeCreateAccount(dependencies) {
  const { userRepository, passwordHasher, emailSender } = dependencies;

  /** @param {{ email?: unknown, password?: unknown }} form - ce que le lecteur a tapé */
  return async function createAccount(form) {
    const email = new Email(form.email);
    const password = new Password(form.password);
    requireEmailSender(emailSender);

    // Chercher d'abord : pas de hachage (coûteux) pour une adresse qui a déjà un compte validé
    const existing = await userRepository.findByEmail(email);
    if (existing?.emailVerifiedAt) throw new ConflictError(ACCOUNT_EXISTS);
    const passwordHash = await passwordHasher.hash(password);
    const user = await createOrTakeOver(userRepository, email, passwordHash, existing);
    await sendVerificationCode(dependencies, user);
    return verificationNeeded(user.email);
  };
}

// existing : le compte jamais validé avec cette adresse, ou null
async function createOrTakeOver(userRepository, email, passwordHash, existing) {
  if (existing) {
    await userRepository.setPasswordHash(existing.id, passwordHash);
    return existing;
  }
  // null : un autre compte vient d'être créé avec cet e-mail, au même instant
  const created = await userRepository.create(email, passwordHash);
  if (!created) throw new ConflictError(ACCOUNT_EXISTS);
  return created;
}
