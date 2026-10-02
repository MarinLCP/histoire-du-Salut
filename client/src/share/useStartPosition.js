// Hook React : où la timeline doit commencer.
// - Adresse normale : au début (0).
// - Lien partagé (?passage=creation) : juste avant ce passage, pour qu'il soit le premier affiché.
// Renvoie null tant que la position du passage partagé n'est pas connue.

import { readSharedSlug } from './shareLink.js';
import { fetchPassage } from '../api/passages.api.js';
import { useStartCursor } from '../hooks/useStartCursor.js';

// Fonction stable (hors du hook) : useStartCursor ne se relance que si le lien change
const findPassagePosition = (slug) => fetchPassage(slug).then((passage) => passage.position);

export function useStartPosition() {
  return useStartCursor(readSharedSlug(window.location.search), findPassagePosition);
}
