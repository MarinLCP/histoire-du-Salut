// Port (contrat) : ce que les use cases demandent pour lire et écrire la bibliothèque d'un lecteur
// (notes privées, surlignages, marque-pages, positions de lecture), sans dire COMMENT. Implémentation : infrastructure/
// postgresLibraryRepository.js. Les valeurs reçues sont déjà vérifiées (domain/library.js).

/**
 * @typedef {object} Library - le format d'échange avec le navigateur
 * @property {Object<string, { text: string, updatedAt: string }>} notes - "Gn 1,3" -> sa note
 * @property {Object<string, { createdAt: string }>} highlights - "Gn 1,3" -> son surlignage
 * @property {Object<string, { position: number, verse: string }>} bookmarks - 'history' | 'bible' -> le
 *   marque-page posé à la main : sa position de lecture et son verset
 * @property {Object<string, { position: number, savedAt: string }>} readings - 'history' | 'bible' -> où le
 *   lecteur en est (retenu pendant la lecture), et quand
 */

/**
 * @typedef {object} LibraryRepository
 * @property {(userId: number) => Promise<Library>} load
 * @property {(userId: number, library: ReturnType<import('./library.js').libraryFrom>) => Promise<void>} merge
 *   - ajoute ce qui vient du navigateur : une note ou une position de lecture n'en remplace une autre que si
 *     elle est plus récente ; surlignages et marque-pages déjà dans le compte sont gardés
 * @property {(userId: number, verseKey: string, text: string) => Promise<void>} saveNote
 * @property {(userId: number, verseKey: string) => Promise<void>} deleteNote
 * @property {(userId: number, verseKey: string) => Promise<void>} addHighlight
 * @property {(userId: number, verseKey: string) => Promise<void>} removeHighlight
 * @property {(userId: number, mode: string, bookmark: { position: number, verse: string }) => Promise<void>} saveBookmark
 * @property {(userId: number, mode: string) => Promise<void>} removeBookmark
 * @property {(userId: number, mode: string, position: number) => Promise<void>} saveReading
 */

export {};
