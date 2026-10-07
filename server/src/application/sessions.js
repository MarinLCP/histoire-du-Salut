// Règles communes aux use cases des comptes : durée d'une session, ouvrir une session, « qui est connecté »,
// « il faut être connecté », et le mot de passe tapé dans un formulaire.

import { UnauthorizedError } from '../domain/errors.js';

// Une connexion dure 30 jours : au-delà, il faut se reconnecter
export const SESSION_DAYS = 30;

// Le lecteur est connecté : une session de SESSION_DAYS jours. Renvoie { user: { email }, token } (la réponse
// des use cases qui connectent : se connecter, valider son e-mail, Google)
export async function openSession(sessionRepository, user) {
  const token = await sessionRepository.open(user.id, SESSION_DAYS);
  return { user: { email: user.email }, token };
}

// Le lecteur d'une session valide, ou null (pas de jeton, jeton inconnu ou session expirée)
/**
 * @param {import('../domain/AccountRepository.js').SessionRepository} sessionRepository
 * @param {string | undefined} token - le jeton de session envoyé par le navigateur (cookie), s'il y en a un
 * @returns {Promise<(import('../domain/AccountRepository.js').User & { hasPassword: boolean }) | null>}
 */
export async function findSessionUser(sessionRepository, token) {
  return token ? sessionRepository.findUser(token) : null;
}

// Le lecteur connecté, sinon UnauthorizedError (401). Sert à tout ce qui est « à moi » (mes notes...).
export async function requireUser(sessionRepository, token) {
  const user = await findSessionUser(sessionRepository, token);
  if (!user) throw new UnauthorizedError('Connecte-toi pour continuer.');
  return user;
}

export async function requireUserId(sessionRepository, token) {
  return (await requireUser(sessionRepository, token)).id;
}

// Le mot de passe tapé dans un formulaire (texte vide s'il manque) : pour VÉRIFIER un mot de passe existant,
// sans les règles d'un nouveau (Password)
/** @param {{ password?: unknown }} form @returns {string} */
export function typedPassword(form) {
  return typeof form.password === 'string' ? form.password : '';
}
