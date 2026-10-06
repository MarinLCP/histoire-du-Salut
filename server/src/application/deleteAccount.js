// Use case : supprimer son compte (droit à l'effacement, RGPD), avec tout ce qui lui appartient.
// Il faut être connecté ET retaper son mot de passe : un appareil laissé ouvert ne suffit pas.

import { UnauthorizedError } from '../domain/errors.js';
import { requireUser } from './sessions.js';

/** @param {{ userRepository, sessionRepository, passwordHasher }} dependencies (ports : domain/AccountRepository.js) */
export function makeDeleteAccount({ userRepository, sessionRepository, passwordHasher }) {
  /** @param {string | undefined} token @param {{ password?: unknown }} form */
  return async function deleteAccount(token, form) {
    const { id } = await requireUser(sessionRepository, token);
    const user = await userRepository.findById(id);
    const password = typeof form.password === 'string' ? form.password : '';
    if (!(await passwordHasher.matches(password, user.passwordHash))) {
      throw new UnauthorizedError('Mot de passe incorrect.');
    }
    await userRepository.delete(id);
  };
}
