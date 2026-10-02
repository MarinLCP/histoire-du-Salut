// Où va chaque bloc de la frise (fonction pure) : à partir de l'arbre de l'API, du chemin dans lequel on est
// entré et de la taille de la zone, une liste de blocs
// { key, nodePath, node, kind, depth, left, top, width, height, z, radius, labelled, small }.
//   - path = [] (vue d'ensemble) : les nœuds du premier niveau en grand escalier ;
//   - path = [1, 0] : les nœuds du chemin deviennent des bandes verticales à gauche (kind 'strip', clic = remonter),
//     les enfants du dernier forment l'escalier (kind 'stair', clic = descendre),
//     et leurs propres enfants de petites marches sans titre (kind 'step', pas cliquables).
// La clé d'un bloc est son chemin dans l'arbre : d'un niveau à l'autre, le même nœud garde sa clé,
// et le navigateur le fait glisser vers sa nouvelle place (transition CSS).

import { staircase } from './staircase.js';

export const MAX_STEPS = 12; // au-delà, les petites marches seraient trop fines pour être vues
const EDGE_MARGIN = 4; // un peu d'air à droite, pour que la dernière marche ne colle pas au bord
const SMALL_ROW = 44; // en dessous de cette hauteur de rangée (px), le titre est plus serré
const STRIP_WIDTHS = [34, 30, 28]; // largeur des bandes de gauche (px), de la plus haute à la plus basse
const STRIP_STEP = 26; // chaque bande commence un peu plus bas que la précédente : un escalier, elles aussi
const STRIP_RADIUS = 14;
const STEP_RADIUS = 4;

/**
 * @param {object[]} roots - les nœuds du premier niveau (époques, ou grands ensembles de la Bible)
 * @param {number[]} path - le chemin des nœuds dans lesquels on est entré ([] = vue d'ensemble)
 * @param {{ width: number, height: number }} box - la taille de la zone de la frise (px)
 */
export function layoutCascade(roots, path, box) {
  const strips = layoutStrips(roots, path, box);
  const stripsWidth = strips.reduce((sum, strip) => sum + strip.width, 0);
  const parent = strips.at(-1)?.node;
  const items = parent ? parent.children : roots;

  return [...strips, ...layoutStairs(items, path, box, stripsWidth)];
}

// Les nœuds du chemin, en bandes verticales côte à côte, chacune un peu plus bas que la précédente
function layoutStrips(roots, path, box) {
  let children = roots;
  let left = 0;

  return path.map((index, rank) => {
    const node = children[index];
    const width = STRIP_WIDTHS[Math.min(rank, STRIP_WIDTHS.length - 1)];
    const top = rank * STRIP_STEP;
    const strip = {
      key: path.slice(0, rank + 1).join('.'), nodePath: path.slice(0, rank + 1), node, kind: 'strip', depth: rank + 1,
      left, top, width, height: box.height - top, z: 1000 + rank, radius: STRIP_RADIUS, labelled: true, small: false,
    };
    children = node.children;
    left += width;
    return strip;
  });
}

// Le grand escalier des enfants du dernier nœud du chemin, à droite des bandes
function layoutStairs(items, path, box, left) {
  const depth = path.length;
  const top = depth <= 1 ? 0 : depth * STRIP_STEP; // sous la dernière bande, qui commence plus bas
  const freeWidth = box.width - left;
  const stairs = staircase({
    left,
    top,
    width: freeWidth - EDGE_MARGIN,
    height: box.height - top,
    count: items.length,
    // Le premier bloc garde la place d'un titre (plus large une fois zoomé : il y a moins de blocs)
    minFirstWidth: depth ? Math.min(freeWidth * 0.5, 170) : Math.min(freeWidth * 0.34, 130),
    maxStairWidth: depth ? 60 : 70, // une marche plus large rendrait l'escalier plat
    stepsOf: (rank) => Math.min(items[rank].children.length, MAX_STEPS),
  });

  return items.flatMap((item, rank) => blocksOfStair(item, [...path, rank], stairs[rank], depth + 1));
}

// Un bloc de l'escalier, puis ses petites marches. z : chaque bloc passe au-dessus du précédent,
// ses marches au-dessus de lui (mais sous le bloc suivant)
function blocksOfStair(item, nodePath, stair, depth) {
  const rank = nodePath.at(-1);
  const block = {
    key: nodePath.join('.'), nodePath, node: item, kind: 'stair', depth, ...stair.rect, z: 2 * rank,
    radius: stair.radius, labelled: true, small: stair.rowHeight < SMALL_ROW,
  };
  const steps = stair.steps.map((step, childRank) => ({
    key: [...nodePath, childRank].join('.'), nodePath: [...nodePath, childRank], node: item.children[childRank],
    kind: 'step', depth: depth + 1, ...step, z: 2 * rank + 1, radius: STEP_RADIUS, labelled: false, small: false,
  }));
  return [block, ...steps];
}
