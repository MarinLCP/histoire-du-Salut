// Un nœud de la vue d'ensemble (la frise) : la même forme à tous les niveaux et dans les deux modes
// (histoire du salut, Bible entière). La frise peut donc avoir un nombre quelconque de niveaux.

/**
 * @typedef {'epoch' | 'episode' | 'group' | 'book' | 'tens' | 'chapter' | 'section'} NodeKind
 *   ce qu'est le nœud (la frise s'en sert pour ses onglets : « Chapitres » = là où l'escalier montre des chapitres)
 */

/**
 * @typedef {object} OverviewNode
 * @property {NodeKind} kind
 * @property {string} title
 * @property {string | null} detail - précision affichée sous le titre (ex. "chapitre 3 · en entier"), ou null
 * @property {string} icon - le nom de son pictogramme (dessiné par le site)
 * @property {number} position - où sauter dans la lecture : un passage (histoire) ou un chapitre (Bible),
 *   avec une partie décimale pour ce qui commence en cours de route (ex. 20.47)
 * @property {OverviewNode[]} children
 */

/** Un nœud qui a sa propre position de lecture (épisode, chapitre, sous-chapitre). @returns {OverviewNode} */
export function node({ kind, title, icon, position, detail = null, children = [] }) {
  return { kind, title, detail, icon, position, children };
}

/** Un regroupement : il mène à la lecture de son premier enfant (époque, ensemble, livre, dizaine). */
export function groupNode({ kind, title, icon, children }) {
  return node({ kind, title, icon, position: children[0].position, children });
}

// Les sous-chapitres d'un chapitre, en feuilles : sectionStarts = [{ verse, title, position }]
export function sectionNodes(sectionStarts = []) {
  return sectionStarts.map(({ verse, title, position }) => node({
    kind: 'section', title, icon: 'lines', position, detail: `v. ${verse}`,
  }));
}
