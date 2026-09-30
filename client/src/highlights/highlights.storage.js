// Sauvegarde des surlignages dans le navigateur.
// Format (version 1) : { "version": 1, "highlights": { "Gn 1,3": { "createdAt": "..." } } }

import { createVersionedStorage } from '../storage/versionedStorage.js';

const storage = createVersionedStorage('highlights', 1);

export const loadHighlights = storage.load;
export const saveHighlights = storage.save;
