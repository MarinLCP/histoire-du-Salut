// Use case : se connecter avec son e-mail et son mot de passe. Renvoie { user: { email }, token } ; ou, si
// l'adresse n'a pas encore été validée, { verificationNeeded: true, email } (un nouveau code est envoyé).
// Un seul message d'erreur, que l'e-mail soit inconnu ou le mot de passe faux : on ne révèle pas
// quels e-mails ont un compte. Le calcul du hachage est fait dans les deux cas (même temps de réponse).

import { Email } from '../domain/Email.js';
import { UnauthorizedError, ValidationError } from '../domain/errors.js';
import { openSession, typedPassword } from './sessions.js';
import { sendVerificationCode, verificationNeeded } from './emailCodes.js';

const WRONG_CREDENTIALS = 'E-mail ou mot de passe incorrect.';

/**
 * @param {{ userRepository, sessionRepository, passwordHasher, emailCodeRepository, emailSender }} dependencies
 *   (ports : domain/AccountRepository.js)
 */
export function makeLogIn(dependencies) {
  const { userRepository, sessionRepository, passwordHasher } = dependencies;
  /** @param {{ email?: unknown, password?: unknown }} form */
  return async function logIn(form) {
    const user = await findUser(userRepository, form.email);
    const isRight = await passwordHasher.matches(typedPassword(form), user?.passwordHash ?? null);
    if (!user || !isRight) throw new UnauthorizedError(WRONG_CREDENTIALS);
    if (!user.emailVerifiedAt) {
      await sendVerificationCode(dependencies, user);
      return verificationNeeded(user.email);
    }
    return openSession(sessionRepository, user);
  };
}

// Une adresse mal formée ne peut pas avoir de compte : même réponse qu'un compte inconnu
async function findUser(userRepository, emailText) {
  try {
    return await userRepository.findByEmail(new Email(emailText));
  } catch (error) {
    if (error instanceof ValidationError) return null;
    throw error;
  }
}
