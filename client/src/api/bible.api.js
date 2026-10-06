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

// Renvoie { parallels, nextCursor } : les parallèles d'un verset, les plus votés d'abord, après le rang `after`
export function fetchParallels({ book, chapter, verse }, after) {
  const [bookPart, chapterPart, versePart] = [book, chapter, verse].map(encodeURIComponent);
  return getJson(`/api/books/${bookPart}/chapters/${chapterPart}/verses/${versePart}/parallels?after=${after}`);
}
