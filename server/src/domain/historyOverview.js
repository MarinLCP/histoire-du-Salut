// L'arbre « Histoire du salut » de la frise : époques → épisodes → chapitres couverts → sous-chapitres.
// Fonction pure : elle reçoit les listes à plat du repository (déjà dans l'ordre) et les imbrique.
// Le seed garantit qu'il n'y a pas de trou ; si la base est modifiée à la main, la frise s'adapte au lieu
// d'échouer : une époque sans épisode est sautée, un épisode sans chapitre devient une feuille.

import { node, groupNode, sectionNodes } from './overviewNode.js';

/**
 * @param {import('./PassageRepository.js').HistoryOutline} outline
 * @returns {import('./overviewNode.js').OverviewNode[]}
 */
export function buildHistoryTree({ epochs, episodes, chapters, sections = [] }) {
  const episodesByEpoch = Map.groupBy(episodes, (episode) => episode.epoch);
  const chaptersByEpisode = Map.groupBy(chapters, (chapter) => chapter.passagePosition);
  // Un sous-chapitre se range sous le chapitre où il commence, dans l'épisode qui le contient
  const sectionsByChapter = Map.groupBy(sections.map(toSectionStart), (section) => section.chapterKey);

  return epochs.filter((epoch) => episodesByEpoch.has(epoch.slug)).map((epoch) => groupNode({
    kind: 'epoch',
    title: epoch.title,
    icon: epoch.icon,
    children: episodesByEpoch.get(epoch.slug).map((episode) => episodeNode(episode, chaptersByEpisode.get(episode.position), sectionsByChapter)),
  }));
}

// chapters : undefined si l'épisode n'a aucun chapitre en base (il devient une feuille)
function episodeNode(episode, chapters = [], sectionsByChapter) {
  const children = chapters.map((chapter) => chapterNode(chapter, sectionsByChapter.get(chapterKey(chapter.passagePosition, chapter.label))));
  return node({ kind: 'episode', title: episode.title, icon: episode.icon, position: episode.position, children });
}

/**
 * Un sous-chapitre qui commence dans un épisode (startShare : part du texte de l'épisode avant lui).
 * @typedef {object} HistorySection
 * @property {number} passagePosition
 * @property {string} chapterLabel
 * @property {string} verse
 * @property {string} title
 * @property {number} startShare
 */

/** @param {HistorySection} section */
function toSectionStart(section) {
  return {
    chapterKey: chapterKey(section.passagePosition, section.chapterLabel),
    verse: section.verse,
    title: section.title,
    position: section.passagePosition + section.startShare,
  };
}

function chapterKey(passagePosition, label) {
  return `${passagePosition}|${label}`;
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
function chapterNode(chapter, sectionStarts) {
  return node({
    kind: 'chapter',
    title: chapter.bookTitle,
    icon: 'page',
    // Sa propre position de lecture (ex. 20.47 : le chapitre commence à 47 % de l'épisode n° 20)
    position: chapter.passagePosition + chapter.startShare,
    detail: `chapitre ${chapter.label} · ${coverage(chapter)}`,
    children: sectionNodes(sectionStarts),
  });
}

// Quelle partie du chapitre l'épisode couvre
function coverage({ fromVerse, toVerse, startsChapter, endsChapter }) {
  if (startsChapter && endsChapter) return 'en entier';
  if (startsChapter) return `jusqu'au v. ${toVerse}`;
  if (endsChapter) return `à partir du v. ${fromVerse}`;
  return `v. ${fromVerse}-${toVerse}`;
}
