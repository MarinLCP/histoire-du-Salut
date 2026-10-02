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

// Les onglets : 0 = vue d'ensemble, 1 = dans l'époque (ou l'ensemble), 2 = le niveau le plus fin.
// focusPath : ce qu'on regarde en ce moment ; ce qui manque est complété par le premier enfant.
export function pathOfTab(roots, focusPath, tab) {
  if (tab === 0) return [];
  if (tab === 1) return [focusPath[0] ?? 0];
  return deepestPath(roots, focusPath);
}

// L'onglet en surbrillance : celui du niveau affiché
export function pressedTab(path) {
  return Math.min(path.length, 2);
}

function nodeAt(roots, path) {
  return path.reduce((node, index) => node.children[index], { children: roots });
}

// Descend depuis focusPath jusqu'au dernier niveau qui a encore des enfants à montrer en escalier
function deepestPath(roots, focusPath) {
  const path = [];
  let node = { children: roots };
  while (node.children.some((child) => child.children.length > 0)) {
    const index = focusPath[path.length] ?? 0;
    path.push(index);
    node = node.children[index];
  }
  return path;
}
