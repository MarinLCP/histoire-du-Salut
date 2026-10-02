// Les chemins dans l'arbre de la frise (fonctions pures).
// Un chemin = les rangs des nœuds, du haut vers le bas : [1, 0] = le 1er enfant du 2e nœud ; [] = tout en haut.

// Une clé texte, unique pour chaque chemin (clé React d'un bloc, comparaison de deux chemins)
export function pathKey(path) {
  return path.join('.');
}

// Le chemin `path` commence-t-il par `prefix` ? (ex. [1, 0, 2] commence par [1, 0])
export function startsWith(path, prefix) {
  return prefix.length <= path.length && prefix.every((index, rank) => path[rank] === index);
}

// Le nœud au bout du chemin. Pour [], une racine imaginaire dont les enfants sont les nœuds du premier niveau
export function nodeAt(roots, path) {
  return path.reduce((node, index) => node.children[index], { children: roots });
}
