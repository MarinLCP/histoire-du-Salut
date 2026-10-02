// Use case : une page de la Bible entière, lue en continu (pagination par curseur sur l'ordre des chapitres).
// Renvoie { chapters, nextCursor } ; nextCursor = la position à passer en `after` pour la suite, ou null.

import { PageRequest, nextCursorOf } from '../domain/PageRequest.js';

// Un chapitre peut être long : 2 par défaut, 5 au plus
const BIBLE_LIMITS = { defaultLimit: 2, maxLimit: 5 };

/** @param {import('../domain/BibleRepository.js').BibleRepository} bibleRepository */
export function makeReadBible(bibleRepository) {
  /** @param {{ after?: string, limit?: string }} query */
  return async function readBible(query) {
    const page = PageRequest.from(query, BIBLE_LIMITS);
    const { chapters, hasMore } = await bibleRepository.findChapterPageAfter(page.after, page.limit);

    return { chapters, nextCursor: nextCursorOf(chapters, hasMore) };
  };
}
