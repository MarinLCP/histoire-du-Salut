// Use cases de la bibliothèque du lecteur connecté : tout lire, y ajouter ce qui était dans le navigateur
// (première connexion), enregistrer ou retirer une note, un surlignage, un marque-page ; retenir où on en est.
// Regroupés dans un fichier : chacun tient en deux lignes (vérifier, puis déléguer au repository).
// Toujours « à moi » : requireUserId (sessions.js) refuse sans session valide (401).

import { requireUserId } from './sessions.js';
import { verseKey, noteText, readingMode, readingPosition, readingBookmark, libraryFrom } from '../domain/library.js';

/**
 * @param {{ sessionRepository: import('../domain/AccountRepository.js').SessionRepository,
 *   libraryRepository: import('../domain/LibraryRepository.js').LibraryRepository }} dependencies
 */
export function makeLibrary({ sessionRepository, libraryRepository }) {
  const userId = (token) => requireUserId(sessionRepository, token);

  return {
    async getLibrary(token) {
      return libraryRepository.load(await userId(token));
    },
    // Renvoie la bibliothèque du compte, une fois fusionnée
    async mergeLibrary(token, body) {
      const id = await userId(token);
      await libraryRepository.merge(id, libraryFrom(body));
      return libraryRepository.load(id);
    },
    async saveNote(token, key, body) {
      await libraryRepository.saveNote(await userId(token), verseKey(key), noteText(body?.text));
    },
    async deleteNote(token, key) {
      await libraryRepository.deleteNote(await userId(token), verseKey(key));
    },
    async addHighlight(token, key) {
      await libraryRepository.addHighlight(await userId(token), verseKey(key));
    },
    async removeHighlight(token, key) {
      await libraryRepository.removeHighlight(await userId(token), verseKey(key));
    },
    // body : { position, verse } (posé à la main sur ce verset)
    async saveBookmark(token, mode, body) {
      await libraryRepository.saveBookmark(await userId(token), readingMode(mode), readingBookmark(body));
    },
    async removeBookmark(token, mode) {
      await libraryRepository.removeBookmark(await userId(token), readingMode(mode));
    },
    // body : { position } (où on en est, retenu pendant la lecture)
    async saveReading(token, mode, body) {
      await libraryRepository.saveReading(await userId(token), readingMode(mode), readingPosition(body?.position));
    },
  };
}
