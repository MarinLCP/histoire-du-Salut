// Hook React : une valeur chargée (par l'API) pour une clé, rechargée quand la clé change.
// - Au départ : `initial` ; une fois chargée : la valeur ; si le chargement échoue : `fallback`.
// - Clé null : rien à charger, la valeur de départ reste.
// load(key) doit rester la même d'un affichage à l'autre (définie hors du composant, ou useCallback),
// et initial / fallback aussi (une constante) : sinon le chargement recommencerait à chaque affichage.
// Utilisé par la frise (useOverview) et par le point de départ d'une liste ouverte par un lien (useStartCursor).

import { useEffect, useState } from 'react';

export function useLoaded(key, load, initial, fallback) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (key === null) return;
    // Si le composant disparaît (ou si la clé change) avant la réponse, on ignore celle-ci
    let ignore = false;
    load(key)
      .then((loaded) => { if (!ignore) setValue(loaded); })
      .catch(() => { if (!ignore) setValue(fallback); });
    return () => {
      ignore = true;
    };
  }, [key, load, fallback]);

  return value;
}
