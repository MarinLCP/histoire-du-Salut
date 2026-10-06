// Hook React : les parallèles d'un verset, chargés 10 par 10 (les plus votés d'abord) :
// la première page à l'ouverture, les suivantes avec le bouton « Voir plus » (loadMore).

import { useCallback, useEffect, useState } from 'react';
import { fetchParallels } from '../api/bible.api.js';
import { parseVerseKey } from '../bible/reference.js';

const FIRST_PAGE = 0;

// verseKey : la référence du verset ("Mt 11,14")
export function useParallels(verseKey) {
  const [parallels, setParallels] = useState([]);
  // Le rang après lequel charger la suite ; null = tout est chargé
  const [nextCursor, setNextCursor] = useState(FIRST_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // isStale() : vrai si la réponse arrive trop tard (panneau refermé, ou premier effet relancé en dev)
  const fetchPage = useCallback((after, isStale) => {
    fetchParallels(parseVerseKey(verseKey), after)
      .then((page) => {
        if (isStale()) return;
        setParallels((previous) => [...previous, ...page.parallels]);
        setNextCursor(page.nextCursor);
      })
      .catch((loadError) => { if (!isStale()) setError(loadError.message); })
      .finally(() => { if (!isStale()) setIsLoading(false); });
  }, [verseKey]);

  // La première page, à l'ouverture (l'état de départ dit déjà « chargement en cours »)
  useEffect(() => {
    let stale = false;
    fetchPage(FIRST_PAGE, () => stale);
    return () => {
      stale = true;
    };
  }, [fetchPage]);

  // « Voir plus », et aussi « Réessayer » après une erreur : la page qui a échoué est redemandée
  function loadMore() {
    setIsLoading(true);
    setError(null);
    fetchPage(nextCursor, () => false);
  }

  return {
    parallels,
    isLoading,
    error,
    canLoadMore: nextCursor !== null && !isLoading && !error,
    loadMore,
  };
}
