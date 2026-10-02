// Hook React : une règle CSS de taille d'écran (ex. '(max-width: 1099px)') est-elle vraie en ce moment ?
// Se met à jour quand la fenêtre change de taille. useSyncExternalStore : la façon de React de lire
// une valeur qui vit hors de React (ici, le navigateur). Sans matchMedia (vieux navigateur) : faux.

import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query) {
  const subscribe = useCallback((onChange) => {
    const list = window.matchMedia?.(query);
    list?.addEventListener('change', onChange);
    return () => list?.removeEventListener('change', onChange);
  }, [query]);

  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false);
}
