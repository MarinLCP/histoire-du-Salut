// Use case : la vue d'ensemble « Bible entière » de la frise (ensembles → livres → dizaines → chapitres), sans texte.

import { buildBibleTree } from '../domain/bibleOverview.js';

/** @param {import('../domain/BibleRepository.js').BibleRepository} bibleRepository */
export function makeGetBibleOverview(bibleRepository) {
  return async function getBibleOverview() {
    return buildBibleTree(await bibleRepository.findBibleOutline());
  };
}
