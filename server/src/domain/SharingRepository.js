// Port (contrat) : partager où on en est (lien de partage, progression), sans dire COMMENT.
// Implémentation : infrastructure/postgresSharingRepository.js.

/**
 * @typedef {object} Progress - ce que montre un lien de partage (jamais l'e-mail, jamais les notes)
 * @property {string | null} name - le prénom donné par Google, ou null (compte e-mail)
 * @property {{ episode: number, total: number, slug: string, title: string } | null} history
 *   - l'épisode de l'histoire du salut où il en est (n° episode sur total), ou null s'il ne l'a pas commencée
 * @property {{ book: { code: string, title: string }, chapter: string } | null} bible
 *   - le chapitre de la Bible entière où il en est, ou null
 */

/**
 * @typedef {object} SharingRepository
 * @property {(userId: number) => Promise<string | null>} findToken - le jeton de son lien, ou null
 * @property {(userId: number) => Promise<string>} open - le jeton du lien (créé s'il n'existe pas encore)
 * @property {(userId: number) => Promise<void>} close - le lien ne mène plus nulle part
 * @property {(token: string) => Promise<Progress | null>} findProgress - null si le lien n'existe pas (ou plus)
 */

export {};
