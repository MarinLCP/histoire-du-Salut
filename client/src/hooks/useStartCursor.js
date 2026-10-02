// Hook React : où commence une liste chargée au fil du défilement, quand on arrive par un lien.
// - Pas de lien : au début (0).
// - Un lien (passage partagé, chapitre de la Bible) : juste avant l'élément visé, pour qu'il soit le premier affiché.
// - Lien cassé : au début, plutôt qu'une erreur.
// Renvoie null tant que la position n'est pas connue.
// Lu une seule fois : quand le lien change, le composant qui l'utilise est recréé (key={...}).
// Utilisé par l'histoire du salut (?passage=) et par la Bible entière (?livre=&chapitre=).

import { useCallback } from 'react';
import { useLoaded } from './useLoaded.js';

const START = 0;

/**
 * @param {string | null} linkKey - ce qui identifie le lien (null = pas de lien)
 * @param {(linkKey: string) => Promise<number>} findPosition - la position de l'élément visé
 *   (appelée seulement s'il y a un lien) ; à définir hors du composant, pour qu'elle reste la même
 */
export function useStartCursor(linkKey, findPosition) {
  // Commencer juste avant l'élément visé, pour qu'il soit le premier affiché
  const findStart = useCallback((key) => findPosition(key).then((position) => position - 1), [findPosition]);
  return useLoaded(linkKey, findStart, linkKey === null ? START : null, START);
}
