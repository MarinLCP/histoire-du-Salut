// Règles communes aux use cases des comptes : durée d'une session, et « il faut être connecté ».

import { UnauthorizedError } from '../domain/errors.js';

// Une connexion dure 30 jours : au-delà, il faut se reconnecter
export const SESSION_DAYS = 30;

// Le lecteur connecté (session valide), sinon UnauthorizedError (401). Sert à tout ce qui est « à moi »
// (supprimer mon compte, mes notes...).
/**
 * @param {import('../domain/AccountRepository.js').SessionRepository} sessionRepository
 * @param {string | undefined} token - le jeton de session envoyé par le navigateur (cookie), s'il y en a un
 * @returns {Promise<import('../domain/AccountRepository.js').User>}
 */
export async function requireUser(sessionRepository, token) {
  const user = token ? await sessionRepository.findUser(token) : null;
  if (!user) throw new UnauthorizedError('Connecte-toi pour continuer.');
  return user;
}
