// Use case : se déconnecter (la session est fermée : son jeton ne sert plus à rien, même volé).
// Sans session, rien à faire : ce n'est pas une erreur.

/** @param {import('../domain/AccountRepository.js').SessionRepository} sessionRepository */
export function makeLogOut(sessionRepository) {
  /** @param {string | undefined} token */
  return async function logOut(token) {
    if (token) await sessionRepository.close(token);
  };
}
