// Hook React : les notes personnelles de l'utilisateur, sauvegardées dans le navigateur.

import { setNote } from './notes.js';
import { loadNotes, saveNotes } from './notes.storage.js';
import { useStoredMap } from '../storage/useStoredMap.js';

export function useNotes() {
  const [notes, setNotes] = useStoredMap(loadNotes, saveNotes);

  // Un texte vide supprime la note
  function save(key, text) {
    setNotes((previous) => setNote(previous, key, text));
  }

  return { notes, save };
}
