// Use case : une page de la timeline (pagination par curseur sur la position).
// Renvoie { passages, nextCursor } ; nextCursor = la position à passer en `after` pour la page
// suivante, ou null s'il n'y a plus rien.

import { PageRequest } from '../domain/PageRequest.js';

/** @param {import('../domain/PassageRepository.js').PassageRepository} passageRepository */
export function makeGetTimeline(passageRepository) {
  /** @param {{ after?: string, limit?: string }} query */
  return async function getTimeline(query) {
    const page = PageRequest.from(query);
    const { passages, hasMore } = await passageRepository.findPageAfter(page.after, page.limit);

    return {
      passages,
      nextCursor: hasMore ? passages.at(-1).position : null,
    };
  };
}
