// L'état de la frise (fonctions pures) : { path, slide, readingKey }.
//   - path : les nœuds dans lesquels on est entré ([] = vue d'ensemble) ;
//   - slide : basculé à chaque changement de niveau, pour relancer l'animation qui cache l'écume et le bateau
//     pendant le glissement (deux classes CSS alternées, voir Frise.css) ;
//   - readingKey : le nœud lu la dernière fois, pour ne suivre la lecture que quand elle change de nœud.

import { followReading } from './readingSync.js';
import { pathKey } from './nodePath.js';

export const INITIAL_VIEW = { path: [], slide: false, readingKey: '' };

// Changer de niveau : le nouveau chemin, et l'animation de glissement relancée
export function viewAt(view, path) {
  return { ...view, path, slide: !view.slide };
}

// La lecture a changé de nœud : la frise la suit, au même niveau de zoom. Même état si rien ne change.
export function viewAfterReading(view, readingNodePath) {
  const readingKey = pathKey(readingNodePath);
  if (readingKey === view.readingKey) return view;

  const followed = followReading(view.path, readingNodePath);
  if (!followed) return { ...view, readingKey };
  return { ...viewAt(view, followed), readingKey };
}
