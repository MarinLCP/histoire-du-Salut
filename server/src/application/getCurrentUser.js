// Use case : qui est connecté ? Renvoie { email } du lecteur, ou null (pas connecté, ou session expirée).
// Le site l'appelle à l'ouverture, pour savoir quoi afficher dans « Mon compte ».

/** @param {import('../domain/AccountRepository.js').SessionRepository} sessionRepository */
export function makeGetCurrentUser(sessionRepository) {
  /** @param {string | undefined} token */
  return async function getCurrentUser(token) {
    const user = token ? await sessionRepository.findUser(token) : null;
    return user ? { email: user.email } : null;
  };
}
