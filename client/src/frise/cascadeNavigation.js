// Navigation dans la frise (fonctions pures) : où mène un clic sur un bloc, et où mènent les onglets.
// path : le chemin des nœuds dans lesquels on est entré ([] = vue d'ensemble, [1, 0] = 1er enfant du 2e nœud).

import { nodeAt, pathKey } from './nodePath.js';

// Le nouveau chemin après un clic sur un bloc, ou null si le clic ne change pas de niveau.
//   - une bande : on remonte au niveau où ce nœud est dans l'escalier ;
//   - un bloc de l'escalier qui a des enfants : on descend dedans.
export function pathAfterClick(roots, { role, nodePath }) {
  if (role === 'strip') return nodePath.slice(0, -1);
  if (nodeAt(roots, nodePath).children.length === 0) return null;
  return nodePath;
}

const TABS = [0, 1, 2];

// Les onglets : 0 = vue d'ensemble, 1 = dans l'époque (ou l'ensemble), 2 = là où l'escalier montre des chapitres.
// focusPath : ce qu'on regarde en ce moment ; ce qui manque est complété par le premier enfant.
export function pathOfTab(roots, focusPath, tab) {
  if (tab === 0) return [];
  if (tab === 1) return [focusPath[0] ?? 0];
  return chaptersPath(roots, focusPath);
}

// L'onglet allumé : celui qui mène exactement au niveau affiché, ou -1 si aucun
// (ex. les dizaines d'un long livre, entre « Livres » et « Chapitres »)
export function pressedTab(roots, path) {
  return TABS.findIndex((tab) => pathKey(pathOfTab(roots, path, tab)) === pathKey(path));
}

// Descend depuis focusPath jusqu'au niveau dont l'escalier montre des chapitres (quelle que soit la profondeur :
// livres, dizaines...), sans jamais s'arrêter sur une feuille (elle n'aurait pas d'escalier à montrer)
function chaptersPath(roots, focusPath) {
  const path = [];
  let node = { children: roots };
  while (node.children.length > 0 && node.children[0].kind !== 'chapter') {
    const index = focusPath[path.length] ?? 0;
    const next = node.children[index];
    if (!next || next.children.length === 0) return path;
    path.push(index);
    node = next;
  }
  return path;
}
