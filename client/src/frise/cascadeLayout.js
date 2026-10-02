// Où va chaque bloc de la frise (fonction pure) : à partir de l'arbre de l'API et de la taille de la zone,
// une liste de blocs { key, node, depth, left, top, width, height, z, radius, labelled, small }.
// Vue d'ensemble : les nœuds du premier niveau en grand escalier (avec leur titre),
// leurs enfants en petites marches à droite (sans titre).

import { staircase } from './staircase.js';

export const MAX_STEPS = 12; // au-delà, les petites marches seraient trop fines pour être vues
const EDGE_MARGIN = 4; // un peu d'air à droite, pour que la dernière marche ne colle pas au bord
const SMALL_ROW = 44; // en dessous de cette hauteur de rangée (px), le titre est plus serré
// Le premier bloc garde la place d'un titre : au moins 130 px (ou un tiers de la zone si elle est étroite)
const FIRST_BLOCK_WIDTH = 130;
const FIRST_BLOCK_SHARE = 0.34;
const MAX_STAIR_WIDTH = 70; // une marche plus large rendrait l'escalier plat

/**
 * @param {object[]} roots - les nœuds du premier niveau (époques, ou grands ensembles de la Bible)
 * @param {{ width: number, height: number }} box - la taille de la zone de la frise (px)
 */
export function layoutOverview(roots, { width, height }) {
  const stairs = staircase({
    left: 0,
    top: 0,
    width: width - EDGE_MARGIN,
    height,
    count: roots.length,
    minFirstWidth: Math.min(width * FIRST_BLOCK_SHARE, FIRST_BLOCK_WIDTH),
    maxStairWidth: MAX_STAIR_WIDTH,
    stepsOf: (rank) => Math.min(roots[rank].children.length, MAX_STEPS),
  });

  return roots.flatMap((root, rank) => blocksOfStair(root, rank, stairs[rank]));
}

// Un bloc de l'escalier, puis ses petites marches. z : chaque bloc passe au-dessus du précédent,
// ses marches au-dessus de lui (mais sous le bloc suivant)
function blocksOfStair(root, rank, stair) {
  const block = {
    key: String(rank), node: root, depth: 1, ...stair.rect, z: 2 * rank, radius: stair.radius,
    labelled: true, small: stair.rowHeight < SMALL_ROW,
  };
  const steps = stair.steps.map((step, childRank) => ({
    key: `${rank}.${childRank}`, node: root.children[childRank], depth: 2, ...step, z: 2 * rank + 1, radius: 4,
    labelled: false, small: false,
  }));
  return [block, ...steps];
}
