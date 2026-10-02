// Appel à l'API « vue d'ensemble » de la frise.

import { getJson } from './http.js';

// mode : 'history' (époques → épisodes → chapitres) ou 'bible' (ensembles → livres → dizaines → chapitres).
// Renvoie un arbre de nœuds { title, detail, icon, position, children }, sans le texte des versets.
export function fetchOverview(mode) {
  return getJson(`/api/overview/${mode}`);
}
