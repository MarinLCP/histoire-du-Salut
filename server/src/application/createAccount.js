// Use case : créer un compte (e-mail + mot de passe), puis ouvrir sa session : le lecteur est connecté
// dans la foulée. Renvoie { user: { email }, token } ; le jeton part dans un cookie (couche http).

import { Email } from '../domain/Email.js';
import { Password } from '../domain/Password.js';
import { ConflictError } from '../domain/errors.js';
import { SESSION_DAYS } from './sessions.js';

/** @param {{ userRepository, sessionRepository, passwordHasher }} dependencies (ports : domain/AccountRepository.js) */
export function makeCreateAccount({ userRepository, sessionRepository, passwordHasher }) {
  /** @param {{ email?: unknown, password?: unknown }} form - ce que le lecteur a tapé */
  return async function createAccount(form) {
    const email = new Email(form.email);
    const password = new Password(form.password);

    const user = await userRepository.create(email, await passwordHasher.hash(password));
    if (!user) throw new ConflictError('Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.');

    const token = await sessionRepository.open(user.id, SESSION_DAYS);
    return { user: { email: user.email }, token };
  };
}
