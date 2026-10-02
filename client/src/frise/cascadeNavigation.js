// Navigation dans la frise (fonctions pures) : où mène un clic sur un bloc, et où mènent les onglets.
// path : le chemin des nœuds dans lesquels on est entré ([] = vue d'ensemble, [1, 0] = 1er enfant du 2e nœud).

// Le nouveau chemin après un clic sur un bloc, ou null si le clic ne change pas de niveau.
//   - une bande : on remonte au niveau où ce nœud est dans l'escalier ;
//   - un bloc de l'escalier qui a des enfants : on descend dedans.
export function pathAfterClick(roots, { kind, nodePath }) {
  if (kind === 'strip') return nodePath.slice(0, -1);
  if (nodeAt(roots, nodePath).children.length === 0) return null;
  return nodePath;
}

const TABS = [0, 1, 2];

// Les onglets : 0 = vue d'ensemble, 1 = dans l'époque (ou l'ensemble), 2 = le niveau le plus fin.
// focusPath : ce qu'on regarde en ce moment ; ce qui manque est complété par le premier enfant.
export function pathOfTab(roots, focusPath, tab) {
  if (tab === 0) return [];
  if (tab === 1) return [focusPath[0] ?? 0];
  return deepestPath(roots, focusPath);
}

// L'onglet allumé : celui qui mène exactement au niveau affiché, ou -1 si aucun
// (ex. les dizaines d'un long livre, entre « Livres » et « Chapitres »)
export function pressedTab(roots, path) {
  return TABS.findIndex((tab) => pathOfTab(roots, path, tab).join('.') === path.join('.'));
}

function nodeAt(roots, path) {
  return path.reduce((node, index) => node.children[index], { children: roots });
}

// Descend depuis focusPath jusqu'au dernier niveau qui a encore des enfants à montrer en escalier
// (sans jamais s'arrêter sur une feuille : elle n'aurait pas d'escalier à montrer)
function deepestPath(roots, focusPath) {
  const path = [];
  let node = { children: roots };
  while (node.children.some((child) => child.children.length > 0)) {
    const index = focusPath[path.length] ?? 0;
    const next = node.children[index];
    if (!next || next.children.length === 0) return path;
    path.push(index);
    node = next;
  }
  return path;
}
