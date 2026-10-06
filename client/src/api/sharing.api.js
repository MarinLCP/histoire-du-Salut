// Appels à l'API du partage de progression : pseudo et lien (lecteur connecté), et ce que montre un lien.

import { getJson, sendJson } from './http.js';

// Renvoie { displayName, token } : le pseudo et le jeton du lien (null s'ils n'existent pas)
export function fetchSharing() {
  return getJson('/api/me/sharing');
}

// Renvoie { displayName } : le pseudo tel qu'il est rangé
export function saveDisplayName(displayName) {
  return sendJson('PUT', '/api/me/profile', { displayName });
}

// Renvoie { token } : le lien de partage (le même s'il existe déjà)
export function openShare() {
  return sendJson('POST', '/api/me/sharing');
}

export function closeShare() {
  return sendJson('DELETE', '/api/me/sharing');
}

// Renvoie { displayName, history, bible } : où en est le lecteur qui a partagé ce lien
export function fetchProgress(token) {
  return getJson(`/api/progress/${encodeURIComponent(token)}`);
}
