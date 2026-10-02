// Appels à l'API des passages.
// Les composants passent par ces fonctions au lieu d'appeler fetch directement.

import { getJson } from './http.js';

// Renvoie { passages, nextCursor } : les passages qui suivent la position `after`
export function fetchTimeline(after) {
  return getJson(`/api/timeline?after=${after}`);
}

// Renvoie le passage qui a ce slug (ex. "creation"), avec ses versets
export function fetchPassage(slug) {
  return getJson(`/api/passages/${encodeURIComponent(slug)}`);
}
