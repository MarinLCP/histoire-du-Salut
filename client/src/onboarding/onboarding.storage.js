// Ce que le lecteur a déjà vu de la présentation du site, gardé dans le navigateur (propre à chaque appareil,
// comme les réglages) : ni compte ni serveur pour ça.
// Format (version 1) : { "version": 1, "onboarding": { "welcome": true, "longPressHint": true } }

import { createVersionedStorage } from '../storage/versionedStorage.js';

const storage = createVersionedStorage('onboarding', 1);

// step : 'welcome' (les cartes d'accueil) ou 'longPressHint' (l'astuce de l'appui long)
export function hasSeen(step) {
  return storage.load().get(step) === true;
}

export function markSeen(step) {
  const seen = storage.load();
  seen.set(step, true);
  storage.save(seen);
}
