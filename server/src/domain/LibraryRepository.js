// Port (contrat) : ce que les use cases demandent pour lire et écrire la bibliothèque d'un lecteur
// (notes privées, surlignages, marque-pages), sans dire COMMENT. Implémentation : infrastructure/
// postgresLibraryRepository.js. Les valeurs reçues sont déjà vérifiées (domain/library.js).

/**
 * @typedef {object} Library - le format d'échange avec le navigateur
 * @property {Object<string, { text: string, updatedAt: string }>} notes - "Gn 1,3" -> sa note
 * @property {Object<string, { createdAt: string }>} highlights - "Gn 1,3" -> son surlignage
 * @property {Object<string, number>} bookmarks - 'history' | 'bible' -> position de lecture
 */

/**
 * @typedef {object} LibraryRepository
 * @property {(userId: number) => Promise<Library>} load
 * @property {(userId: number, library: ReturnType<import('./library.js').libraryFrom>) => Promise<void>} merge
 *   - ajoute ce qui vient du navigateur : une note n'en remplace une autre que si elle est plus récente ;
 *     surlignages et marque-pages déjà dans le compte sont gardés
 * @property {(userId: number, verseKey: string, text: string) => Promise<void>} saveNote
 * @property {(userId: number, verseKey: string) => Promise<void>} deleteNote
 * @property {(userId: number, verseKey: string) => Promise<void>} addHighlight
 * @property {(userId: number, verseKey: string) => Promise<void>} removeHighlight
 * @property {(userId: number, mode: string, position: number) => Promise<void>} saveBookmark
 */

export {};
