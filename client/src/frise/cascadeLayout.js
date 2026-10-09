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
import { pathKey, startsWith } from './nodePath.js';

export const MAX_STEPS = 12; // au-delà, les petites marches seraient trop fines pour être vues
const EDGE_MARGIN = 4; // un peu d'air à droite, pour que la dernière marche ne colle pas au bord
const SMALL_ROW = 44; // en dessous de cette hauteur de rangée (px), le titre est plus serré
const STRIP_WIDTHS = [34, 30, 28]; // largeur des bandes de gauche (px), de la plus haute à la plus basse
const STRIP_STEP = 26; // chaque bande commence un peu plus bas que la précédente : un escalier, elles aussi
const STRIP_RADIUS = 14;
// Le bord extérieur de la cascade (les petites marches) est arrondi : l'eau passe le bord de la marche (« arrondi
// doux », choisi par Marin). Le coin d'un bloc qui a des marches reste droit : elles le touchent, sinon le fond
// de la page apparaîtrait entre les deux
const STEP_RADIUS = 26;
const STRIPS_LAYER = 1000; // les bandes passent au-dessus de l'escalier
// Le bateau (2,3rem de côté) se pose au bord droit du haut d'un bloc, juste au-dessus
const BOAT_FROM_RIGHT = 38;
const BOAT_ABOVE = 22;
const BOAT_MIN_TOP = -6; // sans sortir du cadre en haut
const RIBBON_FROM_RIGHT = 26; // le ruban du marque-page dépasse du haut du bloc, près de son bord droit

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

// Où poser le ruban du marque-page : sur le bloc de l'escalier qui contient la position retenue
// (bookmarkNodePath, son chemin dans l'arbre), avec le titre de ce bloc ; null si elle n'est dans aucun
export function ribbonPlace(blocks, bookmarkNodePath) {
  if (bookmarkNodePath.length === 0) return null;
  const block = blocks.find((candidate) => candidate.role === 'stair' && startsWith(bookmarkNodePath, candidate.nodePath));
  if (!block) return null;
  return { left: block.left + block.width - RIBBON_FROM_RIGHT, top: block.top, title: block.node.title };
}

// Le passage d'une disposition (before) à la suivante (after), pour une transition propre :
// - un bloc qui garde son rôle de bloc qui glisse garde sa clé React : il glisse vers sa nouvelle place ;
// - un bloc qui arrive (absent avant) ou qui redevient une petite marche (bande ou bloc de l'escalier devenu
//   marche, quand on remonte d'un niveau) apparaît en fondu, une fois les autres en place. Sinon il glisserait
//   à contretemps du bloc qu'il doit toucher, et le fond de la page apparaîtrait entre les deux. S'il était
//   affiché, il reçoit une nouvelle clé React : React le recrée au lieu de le faire glisser.
// Au tout premier affichage (before vide) : rien en fondu, la frise apparaît d'un coup.
// previousKeys : les clés React d'avant (Map clé du nœud -> clé React) ; generation : un numéro qui change à
// chaque transition (pour fabriquer des clés React neuves). Renvoie { reactKeys, entering } (Map, Set).
export function blockTransition(before, after, previousKeys = new Map(), generation = 0) {
  const roleBefore = new Map(before.map((block) => [block.key, block.role]));
  const reactKeys = new Map();
  const entering = new Set();
  for (const block of after) {
    const role = roleBefore.get(block.key);
    const isDemoted = block.role === 'step' && role !== undefined && role !== 'step';
    if (before.length > 0 && (role === undefined || isDemoted)) entering.add(block.key);
    const reactKey = isDemoted ? `${block.key}~${generation}` : (previousKeys.get(block.key) ?? block.key);
    reactKeys.set(block.key, reactKey);
  }
  return { reactKeys, entering };
}
