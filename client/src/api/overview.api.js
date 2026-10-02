// Appel à l'API « vue d'ensemble » de la frise.
// L'arbre ne change pas pendant une visite (seulement quand la base est remplie à nouveau) :
// il est gardé en mémoire, un par mode, et n'est téléchargé qu'une fois (aller-retour entre les pages).

import { getJson } from './http.js';

// mode -> la promesse de son arbre (déjà résolue, ou en cours)
const overviews = new Map();

// mode : 'history' (époques → épisodes → chapitres) ou 'bible' (ensembles → livres → dizaines → chapitres).
// Renvoie un arbre de nœuds { title, detail, icon, position, children }, sans le texte des versets.
export function fetchOverview(mode) {
  if (!overviews.has(mode)) overviews.set(mode, download(mode));
  return overviews.get(mode);
}

// Un échec n'est pas retenu : le prochain appel réessaiera
function download(mode) {
  return getJson(`/api/overview/${mode}`).catch((error) => {
    overviews.delete(mode);
    throw error;
  });
}

// Pour les tests : chaque test repart sans arbre en mémoire
export function forgetOverviews() {
  overviews.clear();
}
