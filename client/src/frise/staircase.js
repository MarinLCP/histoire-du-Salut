// Le grand escalier de la frise (d'après le dessin de Marin), en fonction pure : des rectangles, sans navigateur.
// - `count` blocs, chacun une rangée plus bas que le précédent, et tous descendent jusqu'en bas (rien ne flotte) ;
// - chaque bloc est plus large que le précédent d'une « marche » ;
// - à droite de chaque bloc, ses enfants forment un petit escalier qui part du HAUT du bloc
//   et finit pile au début du bloc suivant ;
// - au pied de chaque chute (sauf la première), l'écume : là où l'eau du bloc précédent tombe sur celui-ci.

const STEPS_SHARE_OF_ROW = 0.85; // le petit escalier occupe le haut de la rangée, pas toute sa hauteur
const ROUNDED_END = 26; // arrondi (px) d'un bloc sans marches : le bout de la surface (le même que ses marches)

/**
 * @param {object} area
 * @param {number} area.left
 * @param {number} area.top
 * @param {number} area.width
 * @param {number} area.height
 * @param {number} area.count - le nombre de blocs
 * @param {number} area.minFirstWidth - largeur minimale du premier bloc
 * @param {number} area.maxStairWidth - largeur maximale d'une marche
 * @param {(rank: number) => number} area.stepsOf - le nombre de petites marches du bloc n° rank
 */
export function staircase({ left, top, width, height, count, minFirstWidth, maxStairWidth, stepsOf }) {
  const rowHeight = height / count;
  const stairWidth = Math.min((width - minFirstWidth) / count, maxStairWidth);
  const firstWidth = width - count * stairWidth;
  const bottom = top + height;

  return Array.from({ length: count }, (_, rank) => {
    const rowTop = top + rank * rowHeight;
    const right = left + firstWidth + rank * stairWidth;
    const steps = smallSteps({ left: right, top: rowTop, bottom, rowHeight, stairWidth, count: stepsOf(rank) });

    return {
      rect: { left, top: rowTop, width: right - left, height: bottom - rowTop },
      steps,
      rowHeight,
      radius: steps.length === 0 ? ROUNDED_END : 0,
      // Position relative au bloc : sous la dernière marche du bloc précédent
      foam: rank === 0 ? null : { x: right - stairWidth - left, width: stairWidth },
    };
  });
}

// Le petit escalier d'un bloc : `count` marches de plus en plus larges et basses, jusqu'en bas
function smallSteps({ left, top, bottom, rowHeight, stairWidth, count }) {
  return Array.from({ length: count }, (_, step) => {
    const stepTop = top + (rowHeight * STEPS_SHARE_OF_ROW * step) / count;
    return { left, top: stepTop, width: (stairWidth * (step + 1)) / count, height: bottom - stepTop };
  });
}
