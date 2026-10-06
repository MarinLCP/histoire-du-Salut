// Use case : se connecter avec son e-mail et son mot de passe. Renvoie { user: { email }, token }.
// Un seul message d'erreur, que l'e-mail soit inconnu ou le mot de passe faux : on ne révèle pas
// quels e-mails ont un compte. Le calcul du hachage est fait dans les deux cas (même temps de réponse).

import { Email } from '../domain/Email.js';
import { UnauthorizedError, ValidationError } from '../domain/errors.js';
import { SESSION_DAYS } from './sessions.js';

const WRONG_CREDENTIALS = 'E-mail ou mot de passe incorrect.';

/** @param {{ userRepository, sessionRepository, passwordHasher }} dependencies (ports : domain/AccountRepository.js) */
export function makeLogIn({ userRepository, sessionRepository, passwordHasher }) {
  /** @param {{ email?: unknown, password?: unknown }} form */
  return async function logIn(form) {
    const user = await findUser(userRepository, form.email);
    const password = typeof form.password === 'string' ? form.password : '';
    const isRight = await passwordHasher.matches(password, user?.passwordHash ?? null);
    if (!user || !isRight) throw new UnauthorizedError(WRONG_CREDENTIALS);

    const token = await sessionRepository.open(user.id, SESSION_DAYS);
    return { user: { email: user.email }, token };
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
