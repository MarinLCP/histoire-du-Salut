// Un nœud de la vue d'ensemble (la frise) : la même forme à tous les niveaux et dans les deux modes
// (histoire du salut, Bible entière). La frise peut donc avoir un nombre quelconque de niveaux.

/**
 * @typedef {object} OverviewNode
 * @property {string} title
 * @property {string | null} detail - précision affichée après le titre (ex. "chapitre 3 · en entier"), ou null
 * @property {string} icon - le nom de son pictogramme (dessiné par le site)
 * @property {number} position - où sauter dans la lecture : un passage (histoire) ou un chapitre (Bible)
 * @property {OverviewNode[]} children
 */

/** Une feuille : ce qu'on lit (pas d'enfants). @returns {OverviewNode} */
export function leafNode({ title, icon, position, detail = null }) {
  return { title, detail, icon, position, children: [] };
}

/** Un regroupement : il mène à la lecture de son premier enfant. @returns {OverviewNode} */
export function parentNode({ title, icon, children }) {
  return { title, detail: null, icon, position: children[0].position, children };
}
