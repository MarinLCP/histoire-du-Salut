// Appels à l'API du partage de progression : le lien (lecteur connecté), et ce que montre un lien.

import { getJson, sendJson } from './http.js';

// Renvoie { token } : le jeton du lien (null s'il n'existe pas)
export function fetchSharing() {
  return getJson('/api/me/sharing');
}

// Renvoie { token } : le lien de partage (le même s'il existe déjà)
export function openShare() {
  return sendJson('POST', '/api/me/sharing');
}

export function closeShare() {
  return sendJson('DELETE', '/api/me/sharing');
}

// Renvoie { name, history, bible } : où en est le lecteur qui a partagé ce lien (name : prénom Google, ou null)
export function fetchProgress(token) {
  return getJson(`/api/progress/${encodeURIComponent(token)}`);
}
