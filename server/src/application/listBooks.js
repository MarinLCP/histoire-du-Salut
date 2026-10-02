// Use case : la liste des livres de la Bible, dans l'ordre.

/** @param {import('../domain/BibleRepository.js').BibleRepository} bibleRepository */
export function makeListBooks(bibleRepository) {
  return function listBooks() {
    return bibleRepository.findBooks();
  };
}
