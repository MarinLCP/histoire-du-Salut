// Hook React : l'arbre de la vue d'ensemble d'un mode ('history' ou 'bible'), chargé une fois.
// Renvoie [] tant qu'il n'est pas là, ou si le chargement échoue : la frise aide à se repérer,
// la lecture reste possible sans elle.

import { useEffect, useState } from 'react';
import { fetchOverview } from '../api/overview.api.js';

export function useOverview(mode) {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    // Si le composant disparaît (ou change de mode) avant la réponse, on ignore celle-ci
    let ignore = false;
    fetchOverview(mode)
      .then((nodes) => { if (!ignore) setTree(nodes); })
      .catch(() => { if (!ignore) setTree([]); });
    return () => {
      ignore = true;
    };
  }, [mode]);

  return tree;
}
