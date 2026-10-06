// Use cases du partage de progression : ouvrir ou fermer son lien de partage (lecteur connecté), et lire la
// progression derrière un lien (n'importe qui, sans compte).
// Regroupés dans un fichier : chacun tient en quelques lignes (vérifier, puis déléguer au repository).

import { requireUserId } from './sessions.js';
import { NotFoundError } from '../domain/errors.js';

/**
 * @param {{ sessionRepository: import('../domain/AccountRepository.js').SessionRepository,
 *   sharingRepository: import('../domain/SharingRepository.js').SharingRepository }} dependencies
 */
export function makeSharing({ sessionRepository, sharingRepository }) {
  const userId = (token) => requireUserId(sessionRepository, token);

  return {
    // { token } : le lien du lecteur connecté (null s'il n'en a pas)
    async getSharing(sessionToken) {
      return { token: await sharingRepository.findToken(await userId(sessionToken)) };
    },
    async openShare(sessionToken) {
      return { token: await sharingRepository.open(await userId(sessionToken)) };
    },
    async closeShare(sessionToken) {
      await sharingRepository.close(await userId(sessionToken));
    },
    async getProgress(shareToken) {
      const progress = await sharingRepository.findProgress(String(shareToken));
      if (!progress) throw new NotFoundError('Ce lien de partage n\'existe pas, ou plus.');
      return progress;
    },
  };
}
