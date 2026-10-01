// Use case : lire un passage par son slug.
// Il orchestre le domaine (PassageSlug) et le repository, sans connaître ni HTTP ni PostgreSQL.
// Le repository est INJECTÉ : en production celui de PostgreSQL, dans les tests un faux en mémoire.

import { PassageSlug } from '../domain/PassageSlug.js';
import { NotFoundError } from '../domain/errors.js';

/** @param {import('../domain/PassageRepository.js').PassageRepository} passageRepository */
export function makeGetPassage(passageRepository) {
  /** @param {string} slugText */
  return async function getPassage(slugText) {
    // Un slug mal formé ne peut désigner aucun passage : pour l'utilisateur, c'est "introuvable"
    if (!PassageSlug.isValid(slugText)) throw passageNotFound(slugText);

    const passage = await passageRepository.findBySlug(new PassageSlug(slugText));
    if (!passage) throw passageNotFound(slugText);

    return passage;
  };
}

function passageNotFound(slugText) {
  return new NotFoundError(`Passage "${slugText}" introuvable.`);
}
