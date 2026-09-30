// Hook React : les surlignages de l'utilisateur, chargés au démarrage et sauvegardés à chaque changement.

import { useEffect, useState } from 'react';
import { toggleHighlight } from './highlights.js';
import { loadHighlights, saveHighlights } from './highlights.storage.js';

export function useHighlights() {
  // loadHighlights est passée sans () : React ne l'appelle qu'une fois, au premier affichage
  const [highlights, setHighlights] = useState(loadHighlights);

  useEffect(() => {
    saveHighlights(highlights);
  }, [highlights]);

  function toggle(key) {
    setHighlights((previous) => toggleHighlight(previous, key));
  }

  return { highlights, toggle };
}
