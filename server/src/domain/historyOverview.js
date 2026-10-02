// L'arbre « Histoire du salut » de la frise : époques → épisodes → chapitres couverts par chaque épisode.
// Fonction pure : elle reçoit les listes à plat du repository (déjà dans l'ordre) et les imbrique.

import { leafNode, parentNode, groupBy } from './overviewNode.js';

/**
 * @param {object} outline
 * @param {{ slug: string, title: string, icon: string }[]} outline.epochs
 * @param {{ position: number, title: string, icon: string, epoch: string }[]} outline.episodes
 * @param {CoveredChapter[]} outline.chapters
 * @returns {import('./overviewNode.js').OverviewNode[]}
 */
export function buildHistoryTree({ epochs, episodes, chapters }) {
  const episodesByEpoch = groupBy(episodes, (episode) => episode.epoch);
  const chaptersByEpisode = groupBy(chapters, (chapter) => chapter.passagePosition);

  return epochs.map((epoch) => parentNode({
    title: epoch.title,
    icon: epoch.icon,
    children: episodesByEpoch.get(epoch.slug).map((episode) => episodeNode(episode, chaptersByEpisode.get(episode.position))),
  }));
}

function episodeNode(episode, chapters) {
  return parentNode({ title: episode.title, icon: episode.icon, children: chapters.map(chapterNode) });
}

/**
 * Un chapitre couvert par un épisode : ses versets de début et de fin DANS ce chapitre,
 * et si l'épisode part du début du chapitre / va jusqu'à sa fin.
 * @typedef {object} CoveredChapter
 * @property {number} passagePosition
 * @property {string} bookTitle
 * @property {string} label
 * @property {string} fromVerse
 * @property {string} toVerse
 * @property {boolean} startsChapter
 * @property {boolean} endsChapter
 */

/** @param {CoveredChapter} chapter */
function chapterNode(chapter) {
  return leafNode({
    title: chapter.bookTitle,
    icon: 'page',
    position: chapter.passagePosition,
    detail: `chapitre ${chapter.label} · ${coverage(chapter)}`,
  });
}

// Quelle partie du chapitre l'épisode couvre
function coverage({ fromVerse, toVerse, startsChapter, endsChapter }) {
  if (startsChapter && endsChapter) return 'en entier';
  if (startsChapter) return `jusqu'au v. ${toVerse}`;
  if (endsChapter) return `à partir du v. ${fromVerse}`;
  return `v. ${fromVerse}-${toVerse}`;
}
