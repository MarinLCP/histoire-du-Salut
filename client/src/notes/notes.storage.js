// Sauvegarde des notes dans le navigateur.
// Format (version 1) : { "version": 1, "notes": { "Gn 1,3": { "text": "...", "updatedAt": "..." } } }

import { createVersionedStorage } from '../storage/versionedStorage.js';

const storage = createVersionedStorage('notes', 1);

export const loadNotes = storage.load;
export const saveNotes = storage.save;
