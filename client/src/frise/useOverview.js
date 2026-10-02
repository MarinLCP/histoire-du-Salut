// Hook React : l'arbre de la vue d'ensemble d'un mode ('history' ou 'bible'), chargé une fois.
// Renvoie [] tant qu'il n'est pas là, ou si le chargement échoue : la frise aide à se repérer,
// la lecture reste possible sans elle.

import { fetchOverview } from '../api/overview.api.js';
import { useLoaded } from '../hooks/useLoaded.js';

// Une seule liste vide (la même d'un affichage à l'autre) : voir useLoaded
const NO_TREE = [];

export function useOverview(mode) {
  return useLoaded(mode, fetchOverview, NO_TREE, NO_TREE);
}
