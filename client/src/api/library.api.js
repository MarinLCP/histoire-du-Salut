// Appels à l'API de la bibliothèque du lecteur connecté (notes privées, surlignages, marque-pages).
// Format d'échange, le même que dans le navigateur :
//   { notes: { "Gn 1,3": { text, updatedAt } }, highlights: { "Gn 1,3": { createdAt } }, bookmarks: { history: 12.4 } }

import { sendJson } from './http.js';

const versePath = (kind, key) => `/api/me/${kind}/${encodeURIComponent(key)}`;

// Ajoute au compte ce qui était dans le navigateur (le plus récent gagne) ; renvoie toute la bibliothèque
export function mergeLibrary(library) {
  return sendJson('POST', '/api/me/library', library);
}

export function saveNote(key, text) {
  return sendJson('PUT', versePath('notes', key), { text });
}

export function deleteNote(key) {
  return sendJson('DELETE', versePath('notes', key));
}

export function addHighlight(key) {
  return sendJson('PUT', versePath('highlights', key));
}

export function removeHighlight(key) {
  return sendJson('DELETE', versePath('highlights', key));
}

export function saveBookmark(mode, position) {
  return sendJson('PUT', `/api/me/bookmarks/${mode}`, { position });
}
