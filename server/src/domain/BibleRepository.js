// Port (contrat) : ce dont le domaine a besoin pour lire la Bible entière, sans dire COMMENT.
// L'implémentation PostgreSQL est dans infrastructure/postgresBibleRepository.js.

/**
 * @typedef {object} Chapter
 * @property {number} position - ordre de lecture dans toute la Bible
 * @property {{ code: string, title: string }} book
 * @property {string} chapter - le numéro, en texte (ex. "1", "9A")
 * @property {import('./PassageRepository.js').Verse[]} verses
 */

/**
 * @typedef {object} BibleRepository
 * @property {(bookCode: string, label: string) => Promise<{ position: number } | null>} findChapter
 *   - la position d'un chapitre dans la lecture continue, ou null s'il n'existe pas
 * @property {(after: number, limit: number) => Promise<{ chapters: Chapter[], hasMore: boolean }>} findChapterPageAfter
 *   - au plus `limit` chapitres de position > after, dans l'ordre de lecture, et s'il en reste d'autres après
 * @property {() => Promise<BibleOutline>} findBibleOutline
 *   - les grands ensembles, les livres et les chapitres, à plat, sans texte et dans l'ordre (pour la frise)
 */

/**
 * @typedef {object} BibleOutline
 * @property {{ slug: string, title: string, icon: string }[]} groups
 * @property {{ code: string, title: string, group: string }[]} books - group : slug de son grand ensemble
 * @property {{ position: number, book: string, label: string }[]} chapters - book : code du livre
 * @property {{ chapterPosition: number, verse: string, title: string, startShare: number }[]} sections
 *   - les sous-chapitres ; startShare : part du texte du chapitre avant le verset où ils commencent
 */

export {};
