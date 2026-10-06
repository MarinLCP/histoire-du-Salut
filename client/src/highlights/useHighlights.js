// Hook React : les surlignages de l'utilisateur, sauvegardés dans le navigateur.

import { toggleHighlight } from './highlights.js';
import { loadHighlights, saveHighlights } from './highlights.storage.js';
import { useStoredMap } from '../storage/useStoredMap.js';
import { mergeInto } from '../backup/backup.js';

export function useHighlights() {
  const [highlights, setHighlights] = useStoredMap(loadHighlights, saveHighlights);

  function toggle(key) {
    setHighlights((previous) => toggleHighlight(previous, key));
  }

  // Ajoute des surlignages importés (sauvegarde) à ceux qu'on a déjà
  function merge(imported) {
    setHighlights((previous) => mergeInto(previous, imported));
  }

  return { highlights, toggle, merge };
}
