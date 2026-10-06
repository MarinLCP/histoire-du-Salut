// Use cases du partage de progression : choisir son pseudo, ouvrir ou fermer son lien de partage (lecteur
// connecté), et lire la progression derrière un lien (n'importe qui, sans compte).
// Regroupés dans un fichier : chacun tient en quelques lignes (vérifier, puis déléguer au repository).

import { requireUser } from './sessions.js';
import { DisplayName } from '../domain/DisplayName.js';
import { NotFoundError, ValidationError } from '../domain/errors.js';

/**
 * @param {{ sessionRepository: import('../domain/AccountRepository.js').SessionRepository,
 *   sharingRepository: import('../domain/SharingRepository.js').SharingRepository }} dependencies
 */
export function makeSharing({ sessionRepository, sharingRepository }) {
  const userId = async (token) => (await requireUser(sessionRepository, token)).id;

  return {
    // { displayName, token } : le pseudo et le lien du lecteur connecté (null s'il n'en a pas)
    async getSharing(sessionToken) {
      return sharingRepository.find(await userId(sessionToken));
    },
    async setDisplayName(sessionToken, body) {
      await sharingRepository.setDisplayName(await userId(sessionToken), new DisplayName(body?.displayName));
    },
    // Le lien est montré sous un pseudo : il en faut un d'abord
    async openShare(sessionToken) {
      const id = await userId(sessionToken);
      const { displayName } = await sharingRepository.find(id);
      if (!displayName) throw new ValidationError('Choisis d\'abord un pseudo.');
      return { token: await sharingRepository.open(id) };
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
