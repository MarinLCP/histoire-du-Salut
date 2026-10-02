// Use case : trouver un chapitre (ex. Gn 3), pour ouvrir la Bible entière à cet endroit.
// Renvoie { position } : la lecture continue commence juste avant (after = position - 1).
// Pas de contrôle de format : la requête est paramétrée, et « n'existe pas » suffit pour un 404.

import { NotFoundError } from '../domain/errors.js';

/** @param {import('../domain/BibleRepository.js').BibleRepository} bibleRepository */
export function makeFindChapter(bibleRepository) {
  /** @param {string} bookCode @param {string} label */
  return async function findChapter(bookCode, label) {
    const chapter = await bibleRepository.findChapter(bookCode, label);
    if (!chapter) throw new NotFoundError(`Chapitre ${bookCode} ${label} introuvable.`);

    return chapter;
  };
}
