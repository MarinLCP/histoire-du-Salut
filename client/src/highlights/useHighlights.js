// Hook React : les surlignages de l'utilisateur, sauvegardés dans le navigateur.

import { toggleHighlight } from './highlights.js';
import { loadHighlights, saveHighlights } from './highlights.storage.js';
import { useStoredMap } from '../storage/useStoredMap.js';

export function useHighlights() {
  const [highlights, setHighlights] = useStoredMap(loadHighlights, saveHighlights);

  function toggle(key) {
    setHighlights((previous) => toggleHighlight(previous, key));
  }

  return { highlights, toggle };
}
