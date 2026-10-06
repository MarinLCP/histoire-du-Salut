// Sauvegarde du marque-page dans le navigateur : une position de lecture par lecture.
// Format (version 1) : { "version": 1, "bookmarks": { "history": 12.4, "bible": 300.2 } }

import { createVersionedStorage } from '../storage/versionedStorage.js';

const storage = createVersionedStorage('bookmarks', 1);

export const loadBookmarks = storage.load;

// mode : 'history' ou 'bible' ; position : la position de lecture continue (ex. 12.4)
export function saveBookmark(mode, position) {
  const bookmarks = storage.load();
  bookmarks.set(mode, position);
  storage.save(bookmarks);
}
