// Hook React : une Map chargée depuis le navigateur au démarrage, et sauvegardée à chaque changement.
// Utilisé par useHighlights et useNotes.

import { useEffect, useState } from 'react';

export function useStoredMap(load, save) {
  // `load` est passée sans () : React ne l'appelle qu'une fois, au premier affichage
  const [entries, setEntries] = useState(load);

  useEffect(() => {
    save(entries);
  }, [entries, save]);

  return [entries, setEntries];
}
