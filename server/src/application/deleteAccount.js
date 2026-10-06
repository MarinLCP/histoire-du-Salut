// Use case : supprimer son compte (droit à l'effacement, RGPD), avec tout ce qui lui appartient.
// Il faut être connecté ET retaper son mot de passe : un appareil laissé ouvert ne suffit pas. Un compte
// Google sans mot de passe confirme en écrivant « SUPPRIMER ».

import { UnauthorizedError, ValidationError } from '../domain/errors.js';

const CONFIRMATION = 'SUPPRIMER';
import { requireUserId, typedPassword } from './sessions.js';

/** @param {{ userRepository, sessionRepository, passwordHasher }} dependencies (ports : domain/AccountRepository.js) */
export function makeDeleteAccount({ userRepository, sessionRepository, passwordHasher }) {
  /** @param {string | undefined} token @param {{ password?: unknown }} form */
  return async function deleteAccount(token, form) {
    const id = await requireUserId(sessionRepository, token);
    // null : le compte vient d'être supprimé depuis un autre appareil
    const user = await userRepository.findById(id);
    if (user && user.passwordHash === null) return deleteWithoutPassword(userRepository, user, form);
    if (!user || !(await passwordHasher.matches(typedPassword(form), user.passwordHash))) {
      throw new UnauthorizedError('Mot de passe incorrect.');
    }
    await userRepository.delete(id);
  };
}

async function deleteWithoutPassword(userRepository, user, form) {
  if (String(form.confirmation ?? '').trim().toUpperCase() !== CONFIRMATION) {
    throw new ValidationError(`Écris ${CONFIRMATION} pour confirmer.`);
  }
  await userRepository.delete(user.id);
}
