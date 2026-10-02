// Où va chaque bloc de la frise (fonction pure) : à partir de l'arbre de l'API, du chemin dans lequel on est
// entré et de la taille de la zone, une liste de blocs
// { key, nodePath, node, role, depth, left, top, width, height, layer, radius, small, foam }.
// role : la place du bloc dans le dessin (à ne pas confondre avec node.kind : ce qu'est le nœud).
//   - path = [] (vue d'ensemble) : les nœuds du premier niveau en grand escalier ;
//   - path = [1, 0] : les nœuds du chemin deviennent des bandes verticales à gauche (role 'strip', clic = remonter),
//     les enfants du dernier forment l'escalier (role 'stair', clic = descendre),
//     et leurs propres enfants de petites marches sans titre (role 'step', pas cliquables).
// La clé d'un bloc est son chemin dans l'arbre : d'un niveau à l'autre, le même nœud garde sa clé,
// et le navigateur le fait glisser vers sa nouvelle place (transition CSS).

import { staircase } from './staircase.js';
import { pathKey } from './nodePath.js';

export const MAX_STEPS = 12; // au-delà, les petites marches seraient trop fines pour être vues
const EDGE_MARGIN = 4; // un peu d'air à droite, pour que la dernière marche ne colle pas au bord
const SMALL_ROW = 44; // en dessous de cette hauteur de rangée (px), le titre est plus serré
const STRIP_WIDTHS = [34, 30, 28]; // largeur des bandes de gauche (px), de la plus haute à la plus basse
const STRIP_STEP = 26; // chaque bande commence un peu plus bas que la précédente : un escalier, elles aussi
const STRIP_RADIUS = 14;
const STEP_RADIUS = 4;
const STRIPS_LAYER = 1000; // les bandes passent au-dessus de l'escalier
// Le bateau (2,3rem de côté) se pose au bord droit du haut d'un bloc, juste au-dessus
const BOAT_FROM_RIGHT = 38;
const BOAT_ABOVE = 22;
const BOAT_MIN_TOP = -6; // sans sortir du cadre en haut

// Les réglages du grand escalier : le premier bloc garde la place d'un titre (plus large une fois zoomé :
// il y a moins de blocs), et une marche plus large rendrait l'escalier plat
const OVERVIEW_STAIRS = { firstBlockWidth: 130, maxStairWidth: 70 };
const ZOOMED_STAIRS = { firstBlockWidth: 170, maxStairWidth: 60 };
// Dans une zone étroite (panneau sur téléphone), le premier bloc prend au plus 60 % de la place
const FIRST_BLOCK_MAX_SHARE = 0.6;

/**
 * @param {object[]} roots - les nœuds du premier niveau (époques, ou grands ensembles de la Bible)
 * @param {number[]} path - le chemin des nœuds dans lesquels on est entré ([] = vue d'ensemble)
 * @param {{ width: number, height: number }} box - la taille de la zone de la frise (px)
 */
export function layoutCascade(roots, path, box) {
  const strips = layoutStrips(roots, path, box);
  const stripsWidth = strips.reduce((sum, strip) => sum + strip.width, 0);
  const items = strips.at(-1)?.node.children ?? roots;

  return [...strips, ...layoutStairs(items, path, box, stripsWidth)];
}

// Un bloc : sa clé vient de son chemin ; les options non données (small, foam) restent fausses
function makeBlock({ nodePath, node, role, depth, rect, layer, radius, small = false, foam = null }) {
  return { key: pathKey(nodePath), nodePath, node, role, depth, ...rect, layer, radius, small, foam };
}

// Les nœuds du chemin, en bandes verticales côte à côte, chacune un peu plus bas que la précédente
function layoutStrips(roots, path, box) {
  let children = roots;
  let left = 0;

  return path.map((index, rank) => {
    const node = children[index];
    const width = STRIP_WIDTHS[Math.min(rank, STRIP_WIDTHS.length - 1)];
    const top = rank * STRIP_STEP;
    const strip = makeBlock({
      nodePath: path.slice(0, rank + 1), node, role: 'strip', depth: rank + 1,
      rect: { left, top, width, height: box.height - top }, layer: STRIPS_LAYER + rank, radius: STRIP_RADIUS,
    });
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
  const settings = depth === 0 ? OVERVIEW_STAIRS : ZOOMED_STAIRS;
  const stairs = staircase({
    left,
    top,
    width: freeWidth - EDGE_MARGIN,
    height: box.height - top,
    count: items.length,
    minFirstWidth: Math.min(freeWidth * FIRST_BLOCK_MAX_SHARE, settings.firstBlockWidth),
    maxStairWidth: settings.maxStairWidth,
    stepsOf: (rank) => Math.min(items[rank].children.length, MAX_STEPS),
  });

  return items.flatMap((item, rank) => blocksOfStair(item, [...path, rank], stairs[rank], depth + 1));
}

// Un bloc de l'escalier, puis ses petites marches. layer : chaque bloc passe au-dessus du précédent,
// ses marches au-dessus de lui (mais sous le bloc suivant)
function blocksOfStair(item, nodePath, stair, depth) {
  const rank = nodePath.at(-1);
  const block = makeBlock({
    nodePath, node: item, role: 'stair', depth, rect: stair.rect, layer: 2 * rank, radius: stair.radius,
    small: stair.rowHeight < SMALL_ROW, foam: stair.foam,
  });
  const steps = stair.steps.map((step, childRank) => makeBlock({
    nodePath: [...nodePath, childRank], node: item.children[childRank], role: 'step', depth: depth + 1,
    rect: step, layer: 2 * rank + 1, radius: STEP_RADIUS,
  }));
  return [block, ...steps];
}

// Où poser le bateau : entre le bloc lu de l'escalier et le suivant, selon la part déjà lue (fraction, de 0 à 1)
export function boatPlace(blocks, { rank, fraction }) {
  const stairs = blocks.filter((block) => block.role === 'stair');
  const from = boatAnchor(stairs[rank]);
  const to = stairs[rank + 1] ? boatAnchor(stairs[rank + 1]) : from;

  return {
    left: from.left + (to.left - from.left) * fraction,
    top: Math.max(BOAT_MIN_TOP, from.top + (to.top - from.top) * fraction),
  };
}

function boatAnchor(block) {
  return { left: block.left + block.width - BOAT_FROM_RIGHT, top: block.top - BOAT_ABOVE };
}
