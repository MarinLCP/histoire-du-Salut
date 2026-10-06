// Use case : supprimer son compte (droit à l'effacement, RGPD), avec tout ce qui lui appartient.
// Il faut être connecté ET retaper son mot de passe : un appareil laissé ouvert ne suffit pas.

import { UnauthorizedError } from '../domain/errors.js';
import { requireUserId, typedPassword } from './sessions.js';

/** @param {{ userRepository, sessionRepository, passwordHasher }} dependencies (ports : domain/AccountRepository.js) */
export function makeDeleteAccount({ userRepository, sessionRepository, passwordHasher }) {
  /** @param {string | undefined} token @param {{ password?: unknown }} form */
  return async function deleteAccount(token, form) {
    const id = await requireUserId(sessionRepository, token);
    // null : le compte vient d'être supprimé depuis un autre appareil
    const user = await userRepository.findById(id);
    if (!user || !(await passwordHasher.matches(typedPassword(form), user.passwordHash))) {
      throw new UnauthorizedError('Mot de passe incorrect.');
    }
    await userRepository.delete(id);
  };
}
