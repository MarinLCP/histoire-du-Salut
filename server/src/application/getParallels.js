// Use case : les parallèles d'un verset (ex. Mt 11,14), les plus votés d'abord, page par page
// (10 d'abord, puis « Voir plus »). Renvoie { parallels, nextCursor } ; nextCursor = le rang à passer
// en `after` pour la suite, ou null.

import { PageRequest, nextCursorOf } from '../domain/PageRequest.js';
import { NotFoundError } from '../domain/errors.js';

const PARALLEL_LIMITS = { defaultLimit: 10, maxLimit: 20 };

/** @param {import('../domain/ParallelRepository.js').ParallelRepository} parallelRepository */
export function makeGetParallels(parallelRepository) {
  /**
   * @param {import('../domain/ParallelRepository.js').VerseReference} origin
   * @param {{ after?: string, limit?: string }} query
   */
  return async function getParallels(origin, query) {
    const page = PageRequest.from(query, PARALLEL_LIMITS);
    const found = await parallelRepository.findPageAfter(origin, page.after, page.limit);
    if (!found) throw new NotFoundError(`Verset ${origin.book} ${origin.chapter},${origin.verse} introuvable.`);

    return { parallels: found.parallels, nextCursor: nextCursorOf(found.parallels, found.hasMore) };
  };
}
