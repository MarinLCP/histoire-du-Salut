// Port (contrat) : ce que les use cases demandent pour lire et écrire la bibliothèque d'un lecteur
// (notes privées, surlignages, marque-pages), sans dire COMMENT. Implémentation : infrastructure/
// postgresLibraryRepository.js. Les valeurs reçues sont déjà vérifiées (domain/library.js).

/**
 * @typedef {object} Library - le format d'échange avec le navigateur
 * @property {Object<string, { text: string, updatedAt: string }>} notes - "Gn 1,3" -> sa note
 * @property {Object<string, { createdAt: string }>} highlights - "Gn 1,3" -> son surlignage
 * @property {Object<string, { position: number, verse: string | null }>} bookmarks - 'history' | 'bible' ->
 *   position de lecture, et le verset où le lecteur l'a posé à la main (null : il suit la lecture)
 */

/**
 * @typedef {object} LibraryRepository
 * @property {(userId: number) => Promise<Library>} load
 * @property {(userId: number, library: ReturnType<import('./library.js').libraryFrom>) => Promise<void>} merge
 *   - ajoute ce qui vient du navigateur : une note n'en remplace une autre que si elle est plus récente ;
 *     surlignages et marque-pages déjà dans le compte sont gardés (sauf un marque-page qui suit la lecture,
 *     remplacé par un marque-page posé à la main dans le navigateur)
 * @property {(userId: number, verseKey: string, text: string) => Promise<void>} saveNote
 * @property {(userId: number, verseKey: string) => Promise<void>} deleteNote
 * @property {(userId: number, verseKey: string) => Promise<void>} addHighlight
 * @property {(userId: number, verseKey: string) => Promise<void>} removeHighlight
 * @property {(userId: number, mode: string, bookmark: { position: number, verse: string | null }) => Promise<void>} saveBookmark
 *   - un marque-page qui suit la lecture ne remplace jamais un marque-page posé à la main
 * @property {(userId: number, mode: string) => Promise<void>} removeBookmark
 */

export {};
