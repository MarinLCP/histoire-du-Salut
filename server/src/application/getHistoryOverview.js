// Use case : la vue d'ensemble « Histoire du salut » de la frise (époques → épisodes → chapitres), sans texte.

import { buildHistoryTree } from '../domain/historyOverview.js';

/** @param {import('../domain/PassageRepository.js').PassageRepository} passageRepository */
export function makeGetHistoryOverview(passageRepository) {
  return async function getHistoryOverview() {
    return buildHistoryTree(await passageRepository.findHistoryOutline());
  };
}
