// Hook React : les notes personnelles de l'utilisateur, sauvegardées dans le navigateur.

import { setNote } from './notes.js';
import { loadNotes, saveNotes } from './notes.storage.js';
import { useStoredMap } from '../storage/useStoredMap.js';
import { mergeInto } from '../backup/backup.js';

export function useNotes() {
  const [notes, setNotes] = useStoredMap(loadNotes, saveNotes);

  // Un texte vide supprime la note
  function save(key, text) {
    setNotes((previous) => setNote(previous, key, text));
  }

  // Ajoute des notes importées (sauvegarde) à celles qu'on a déjà
  function merge(imported) {
    setNotes((previous) => mergeInto(previous, imported));
  }

  return { notes, save, merge };
}
