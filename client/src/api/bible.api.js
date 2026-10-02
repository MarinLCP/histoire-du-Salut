// Appels à l'API de la Bible entière.

import { getJson } from './http.js';

// Renvoie { chapters, nextCursor } : les chapitres qui suivent la position `after`, avec leurs versets
export function fetchBible(after) {
  return getJson(`/api/bible?after=${after}`);
}
