// Appels à l'API de la Bible entière.

import { getJson } from './http.js';

// Renvoie { chapters, nextCursor } : les chapitres qui suivent la position `after`, avec leurs versets
export function fetchBible(after) {
  return getJson(`/api/bible?after=${after}`);
}

// Renvoie { position } : la place d'un chapitre dans la lecture continue (ex. Gn 3)
export function fetchChapter(bookCode, chapter) {
  return getJson(`/api/books/${encodeURIComponent(bookCode)}/chapters/${encodeURIComponent(chapter)}`);
}
