// Sauvegarde des réglages de lecture dans le navigateur.
// Format (version 1) : { "version": 1, "settings": { "textSize": "large", "theme": "dark" } }

import { createVersionedStorage } from '../storage/versionedStorage.js';
import { withDefaults } from './settings.js';

const storage = createVersionedStorage('settings', 1);

export function loadSettings() {
  return withDefaults(Object.fromEntries(storage.load()));
}

export function saveSettings(settings) {
  storage.save(Object.entries(settings));
}
