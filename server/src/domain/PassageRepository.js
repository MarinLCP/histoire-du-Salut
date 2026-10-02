// Port (contrat) : ce dont le domaine a besoin pour lire des passages, sans dire COMMENT.
// JavaScript n'a pas d'interfaces : ce fichier les décrit en JSDoc (VS Code s'en sert pour l'autocomplétion).
// L'implémentation PostgreSQL est dans infrastructure/postgresPassageRepository.js ;
// les tests utilisent de faux repositories en mémoire qui respectent le même contrat.

/**
 * @typedef {object} Verse
 * @property {string} chapter
 * @property {string | null} verse - null pour une ligne sans numéro (ex. "ELLE")
 * @property {'verse' | 'unnumbered'} kind
 * @property {string} text
 * @property {string | null} sectionTitle - l'intertitre du sous-chapitre qui commence à ce verset, ou null
 */

/**
 * @typedef {object} Passage
 * @property {number} position - ordre dans la timeline
 * @property {string} slug
 * @property {string} title
 * @property {{ code: string, title: string }} book
 * @property {{ chapter: string, verse: string }} start
 * @property {{ chapter: string, verse: string }} end
 * @property {Verse[]} verses
 */

/**
 * @typedef {object} PassageRepository
 * @property {(slug: import('./PassageSlug.js').PassageSlug) => Promise<Passage | null>} findBySlug
 * @property {(after: number, limit: number) => Promise<{ passages: Passage[], hasMore: boolean }>} findPageAfter
 *   - au plus `limit` passages de position > after, dans l'ordre, et s'il en reste d'autres après
 * @property {() => Promise<HistoryOutline>} findHistoryOutline
 *   - les époques, les épisodes et les chapitres qu'ils couvrent, à plat et dans l'ordre (pour la frise)
 */

/**
 * @typedef {object} HistoryOutline
 * @property {{ slug: string, title: string, icon: string }[]} epochs
 * @property {{ position: number, title: string, icon: string, epoch: string }[]} episodes - epoch : slug de l'époque
 * @property {import('./historyOverview.js').CoveredChapter[]} chapters
 * @property {import('./historyOverview.js').HistorySection[]} sections
 */

export {};
