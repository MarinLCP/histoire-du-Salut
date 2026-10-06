// Use case : se connecter avec Google, une fois l'identité du lecteur obtenue de Google (http/googleRoutes.js).
// Renvoie { user: { email }, token }. Trois cas :
// - un compte déjà relié à ce compte Google : connecté (le prénom donné par Google est mis à jour) ;
// - un compte avec la même adresse : il est relié à Google. S'il n'avait jamais été validé, son mot de passe
//   est effacé (vol de compte évité : quelqu'un a pu créer ce compte avec TON adresse ; Google prouve
//   qu'elle est à toi) et il devient validé ;
// - sinon : un nouveau compte, sans mot de passe, déjà validé.

import { Email } from '../domain/Email.js';
import { UnauthorizedError } from '../domain/errors.js';
import { SESSION_DAYS } from './sessions.js';

/** @param {{ userRepository, sessionRepository }} dependencies (ports : domain/AccountRepository.js) */
export function makeSignInWithGoogle({ userRepository, sessionRepository }) {
  /** @param {import('../domain/AccountRepository.js').GoogleClaims} claims */
  return async function signInWithGoogle(claims) {
    if (!claims.emailVerified) throw new UnauthorizedError('Ton adresse Google n\'est pas vérifiée par Google.');
    const user = await findOrCreate(userRepository, claims);
    await userRepository.linkGoogle(user.id, claims.sub, claims.givenName);
    const token = await sessionRepository.open(user.id, SESSION_DAYS);
    return { user: { email: user.email }, token };
  };
}

async function findOrCreate(userRepository, claims) {
  const linked = await userRepository.findByGoogleSub(claims.sub);
  if (linked) return linked;

  const email = new Email(claims.email);
  const existing = await userRepository.findByEmail(email);
  if (existing) return takeOver(userRepository, existing);

  const created = await userRepository.createFromGoogle(email, claims.sub, claims.givenName);
  if (!created) throw new UnauthorizedError('Connexion impossible pour le moment : réessaie.');
  return created;
}

// Google prouve que l'adresse est au lecteur : un compte jamais validé perd le mot de passe d'un inconnu
async function takeOver(userRepository, existing) {
  if (existing.emailVerifiedAt) return existing;
  await userRepository.setPasswordHash(existing.id, null);
  await userRepository.markEmailVerified(existing.id);
  return existing;
}
