// Le lien entre la lecture et la frise (fonctions pures).
// x : la position de lecture continue. Ex. 12.4 = on a lu 40 % du passage n° 12 (ou du chapitre n° 12 de la Bible).
// Chaque nœud couvre un intervalle [début, fin) de positions : de sa position à celle de son frère suivant.
// Des frères qui partagent la même position (les chapitres couverts par un même épisode) se partagent
// l'intervalle de leur parent à parts égales.

// Le chemin du nœud lu, à chaque niveau (ex. [1, 0, 2]) ; [] si rien n'est lu
export function readingPath(roots, x) {
  const path = [];
  let level = rootLevel(roots);

  while (x !== null && level.length > 0) {
    const index = level.findIndex(({ span }) => contains(span, x));
    if (index === -1) break;
    path.push(index);
    level = childLevel(level[index]);
  }
  return path;
}

// Dans l'escalier affiché (les enfants du chemin `path`) : le bloc lu et la part déjà lue de ce bloc (de 0 à 1),
// ou null si la lecture est ailleurs
export function currentStair(roots, path, x) {
  if (x === null) return null;
  const level = path.reduce((current, index) => (current[index] ? childLevel(current[index]) : []), rootLevel(roots));
  const rank = level.findIndex(({ span }) => contains(span, x));
  if (rank === -1) return null;

  const [start, end] = level[rank].span;
  return { rank, fraction: (x - start) / (end - start) };
}

// La frise suit la lecture au même niveau de zoom : le nouveau chemin, ou null si rien ne doit bouger
export function followReading(path, readingNodePath) {
  if (path.length === 0 || readingNodePath.length < path.length) return null;
  const followed = readingNodePath.slice(0, path.length);
  if (followed.join('.') === path.join('.')) return null;
  return followed;
}

// --- Les intervalles de lecture ---

// Les nœuds du premier niveau ; le dernier va jusqu'après la dernière position de l'arbre
function rootLevel(roots) {
  if (roots.length === 0) return [];
  return withSpans(roots, [roots[0].position, lastPosition(roots) + 1]);
}

function childLevel({ node, span }) {
  return withSpans(node.children, span);
}

// Des frères avec leur intervalle [début, fin), à l'intérieur de celui de leur parent
function withSpans(nodes, [start, end]) {
  const sharePosition = nodes.every((node) => node.position === nodes[0].position);
  const share = (end - start) / nodes.length;

  return nodes.map((node, index) => ({
    node,
    span: sharePosition
      ? [start + index * share, start + (index + 1) * share]
      : [node.position, nodes[index + 1]?.position ?? end],
  }));
}

function lastPosition(nodes) {
  const last = nodes.at(-1);
  return last.children.length > 0 ? lastPosition(last.children) : last.position;
}

function contains([start, end], x) {
  return x >= start && x < end;
}
