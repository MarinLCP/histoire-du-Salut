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
 */

/**
 * @typedef {object} Passage
 * @property {number} id
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
 */

export {};
