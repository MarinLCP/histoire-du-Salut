// Hook React : où la timeline doit commencer.
// - Adresse normale : au début (0).
// - Lien partagé (?passage=creation) : juste avant ce passage, pour qu'il soit le premier affiché.
// Renvoie null tant que la position du passage partagé n'est pas connue.
// search : la partie « ?... » de l'adresse, lue par le routeur (useLocation) ; le composant qui appelle
// ce hook est recréé (key={search}) quand elle change.

import { readSharedSlug } from './shareLink.js';
import { fetchPassage } from '../api/passages.api.js';
import { useStartCursor } from '../hooks/useStartCursor.js';

// Fonction stable (hors du hook) : useStartCursor ne se relance que si le lien change
const findPassagePosition = (slug) => fetchPassage(slug).then((passage) => passage.position);

export function useStartPosition(search) {
  return useStartCursor(readSharedSlug(search), findPassagePosition);
}
