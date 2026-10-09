// Sauvegarde du marque-page dans le navigateur : un par lecture, posé à la main sur un verset.
// Format (version 3) : { "version": 3, "bookmarks": { "history": { "position": 12.4, "verse": "Gn 3,15" } } }
// - position : la position de lecture continue du verset (ex. 12.4) ;
// - verse : le verset où le lecteur l'a posé.
// Avant (versions 1 et 2), le marque-page pouvait aussi suivre la lecture : c'est devenu la position de lecture
// (readingPositions.storage.js). De la version 2, on garde les marque-pages posés à la main.

import { createVersionedStorage } from '../storage/versionedStorage.js';

const storage = createVersionedStorage('bookmarks', 3);
const versionTwo = createVersionedStorage('bookmarks', 2);

export function loadBookmarks() {
  const bookmarks = storage.load();
  if (bookmarks.size > 0) return bookmarks;
  return new Map([...versionTwo.load()].filter(([, bookmark]) => bookmark?.verse != null));
}

// mode : 'history' ou 'bible' ; bookmark : { position, verse }
export function saveBookmark(mode, bookmark) {
  const bookmarks = loadBookmarks();
  bookmarks.set(mode, bookmark);
  storage.save(bookmarks);
}

export function removeBookmark(mode) {
  const bookmarks = loadBookmarks();
  bookmarks.delete(mode);
  storage.save(bookmarks);
}

// Vide les marque-pages du navigateur (ils ont rejoint le compte du lecteur)
export function clearBookmarks() {
  storage.save(new Map());
}
