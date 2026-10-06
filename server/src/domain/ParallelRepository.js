// Port (contrat) : ce dont le domaine a besoin pour lire les parallèles d'un verset, sans dire COMMENT.
// L'implémentation PostgreSQL est dans infrastructure/postgresParallelRepository.js.

/**
 * @typedef {object} VerseReference
 * @property {string} book - le code du livre (ex. "Ml")
 * @property {string} chapter
 * @property {string} verse
 */

/**
 * @typedef {object} Parallel
 * @property {number} position - son rang parmi les parallèles du verset (1 = le plus voté)
 * @property {number} votes - les votes des lecteurs d'OpenBible.info
 * @property {VerseReference} start - le verset parallèle, ou le début de la plage
 * @property {VerseReference} end - la fin de la plage (= start pour un seul verset)
 * @property {import('./PassageRepository.js').Verse[]} verses - un aperçu : les premiers versets de la plage
 * @property {boolean} isTruncated - la plage a plus de versets que l'aperçu
 */

/**
 * @typedef {object} ParallelRepository
 * @property {(origin: VerseReference, after: number, limit: number)
 *   => Promise<{ parallels: Parallel[], hasMore: boolean } | null>} findPageAfter
 *   - au plus `limit` parallèles du verset, de rang > after, les plus votés d'abord ; null si le verset n'existe pas
 */

export {};
