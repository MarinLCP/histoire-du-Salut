// Sauvegarde du marque-page dans le navigateur : un par lecture.
// Format (version 2) : { "version": 2, "bookmarks": { "history": { "position": 12.4, "verse": null } } }
// - position : la position de lecture continue (ex. 12.4) ;
// - verse : le verset où le lecteur l'a posé à la main ("Gn 1,3" : il ne bouge plus avec la lecture), ou null.
// La version 1 (une position seule par lecture) est relue et convertie : personne ne perd son marque-page.

import { createVersionedStorage } from '../storage/versionedStorage.js';

const storage = createVersionedStorage('bookmarks', 2);
const versionOne = createVersionedStorage('bookmarks', 1);

export function loadBookmarks() {
  const bookmarks = storage.load();
  if (bookmarks.size > 0) return bookmarks;
  return new Map([...versionOne.load()].map(([mode, position]) => [mode, { position, verse: null }]));
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
