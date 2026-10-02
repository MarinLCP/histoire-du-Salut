// Port (contrat) : ce dont le domaine a besoin pour lire la Bible entière, sans dire COMMENT.
// L'implémentation PostgreSQL est dans infrastructure/postgresBibleRepository.js.

/**
 * @typedef {object} Book
 * @property {string} code - ex. "Gn"
 * @property {string} title - ex. "La Genèse"
 * @property {number} position - ordre dans la Bible
 * @property {number} chapterCount
 */

/**
 * @typedef {object} Chapter
 * @property {number} position - ordre de lecture dans toute la Bible
 * @property {{ code: string, title: string }} book
 * @property {string} chapter - le numéro, en texte (ex. "1", "9A")
 * @property {import('./PassageRepository.js').Verse[]} verses
 */

/**
 * @typedef {object} BibleRepository
 * @property {() => Promise<Book[]>} findBooks - dans l'ordre de la Bible
 * @property {(after: number, limit: number) => Promise<{ chapters: Chapter[], hasMore: boolean }>} findChapterPageAfter
 *   - au plus `limit` chapitres de position > after, dans l'ordre de lecture, et s'il en reste d'autres après
 */

export {};
