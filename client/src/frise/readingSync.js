// Le lien entre la lecture et la frise (fonctions pures).
// readingAt : la position de lecture continue. Ex. 12.4 = on a lu 40 % du passage n° 12 (ou du chapitre n° 12).
// Chaque nœud couvre un intervalle [début, fin) de positions : de sa position à celle de son frère suivant
// (le dernier va jusqu'à la fin de son parent). Les chapitres d'un épisode ont une position fractionnaire
// (ex. 20.47 : le chapitre commence à 47 % de l'épisode n° 20), calculée par le serveur.

import { startsWith } from './nodePath.js';

// Le chemin du nœud lu, à chaque niveau (ex. [1, 0, 2]) ; [] si rien n'est lu
export function readingPath(roots, readingAt) {
  const path = [];
  let level = rootLevel(roots);

  while (readingAt !== null && level.length > 0) {
    const index = level.findIndex(({ span }) => contains(span, readingAt));
    if (index === -1) break;
    path.push(index);
    level = childLevel(level[index]);
  }
  return path;
}

// Dans l'escalier affiché (les enfants du chemin `path`) : le bloc lu et la part déjà lue de ce bloc (de 0 à 1),
// ou null si la lecture est ailleurs
export function currentStair(roots, path, readingAt) {
  if (readingAt === null) return null;
  const level = path.reduce((current, index) => (current[index] ? childLevel(current[index]) : []), rootLevel(roots));
  const rank = level.findIndex(({ span }) => contains(span, readingAt));
  if (rank === -1) return null;

  const [start, end] = level[rank].span;
  return { rank, fraction: (readingAt - start) / (end - start) };
}

// La frise suit la lecture au même niveau de zoom : le nouveau chemin, ou null si rien ne doit bouger
// (en vue d'ensemble, quand rien n'est lu à ce niveau, ou quand on regarde déjà ce qu'on lit)
export function followReading(path, readingNodePath) {
  if (path.length === 0 || readingNodePath.length < path.length) return null;
  if (startsWith(readingNodePath, path)) return null;
  return readingNodePath.slice(0, path.length);
}

// --- Les intervalles de lecture ---

// Les nœuds du premier niveau ; le dernier va jusqu'après la dernière position de l'arbre
function rootLevel(roots) {
  if (roots.length === 0) return [];
  // La lecture finit avec le dernier élément (passage ou chapitre) : la partie entière de la dernière
  // position (un chapitre peut commencer en 32.6 : il est dans le passage n° 32, qui finit en 33)
  return withSpans(roots, [roots[0].position, Math.floor(lastPosition(roots)) + 1]);
}

function childLevel({ node, span }) {
  return withSpans(node.children, span);
}

// Des frères avec leur intervalle [début, fin), à l'intérieur de celui de leur parent
function withSpans(nodes, [, end]) {
  return nodes.map((node, index) => ({ node, span: [node.position, nodes[index + 1]?.position ?? end] }));
}

function lastPosition(nodes) {
  const last = nodes.at(-1);
  return last.children.length > 0 ? lastPosition(last.children) : last.position;
}

function contains([start, end], readingAt) {
  return readingAt >= start && readingAt < end;
}
