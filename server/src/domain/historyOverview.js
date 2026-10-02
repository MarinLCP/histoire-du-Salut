// L'arbre « Histoire du salut » de la frise : époques → épisodes → chapitres couverts par chaque épisode.
// Fonction pure : elle reçoit les listes à plat du repository (déjà dans l'ordre) et les imbrique.
// Le seed garantit qu'il n'y a pas de trou ; si la base est modifiée à la main, la frise s'adapte au lieu
// d'échouer : une époque sans épisode est sautée, un épisode sans chapitre devient une feuille.

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

  return epochs.filter((epoch) => episodesByEpoch.has(epoch.slug)).map((epoch) => parentNode({
    title: epoch.title,
    icon: epoch.icon,
    children: episodesByEpoch.get(epoch.slug).map((episode) => episodeNode(episode, chaptersByEpisode.get(episode.position))),
  }));
}

// chapters : undefined si l'épisode n'a aucun chapitre en base
function episodeNode(episode, chapters = []) {
  if (chapters.length === 0) return leafNode({ title: episode.title, icon: episode.icon, position: episode.position });
  return parentNode({ title: episode.title, icon: episode.icon, children: chapters.map(chapterNode) });
}

/**
 * Un chapitre couvert par un épisode : ses versets de début et de fin DANS ce chapitre,
 * si l'épisode part du début du chapitre / va jusqu'à sa fin, et où le chapitre commence dans l'épisode.
 * @typedef {object} CoveredChapter
 * @property {number} passagePosition
 * @property {string} bookTitle
 * @property {string} label
 * @property {string} fromVerse
 * @property {string} toVerse
 * @property {boolean} startsChapter
 * @property {boolean} endsChapter
 * @property {number} startShare - part du texte de l'épisode avant ce chapitre (0 pour le premier, de 0 à 1)
 */

/** @param {CoveredChapter} chapter */
function chapterNode(chapter) {
  return leafNode({
    title: chapter.bookTitle,
    icon: 'page',
    // Sa propre position de lecture (ex. 20.47 : le chapitre commence à 47 % de l'épisode n° 20)
    position: chapter.passagePosition + chapter.startShare,
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
