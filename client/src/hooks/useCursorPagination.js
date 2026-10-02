// Hook React : une liste chargée page par page au fil du défilement (pagination par curseur).
// Utilisé par la timeline de l'histoire du salut et par la Bible entière.
// Un élément invisible (la "sentinelle", sentinelRef) est placé tout en bas de la liste :
// quand il approche de l'écran, on charge la page suivante.

import { useCallback, useEffect, useRef, useState } from 'react';

// On charge la suite un peu AVANT que l'utilisateur n'arrive en bas (600px avant)
const PRELOAD_DISTANCE = '600px';

/**
 * @param {(after: number) => Promise<{ items: object[], nextCursor: number | null }>} fetchPage
 * @param {number} startAfter - la position après laquelle commencer (0 = depuis le début)
 */
export function useCursorPagination(fetchPage, startAfter) {
  const [items, setItems] = useState([]);
  // Position après laquelle charger la page suivante ; null = on est arrivé au bout
  const [nextCursor, setNextCursor] = useState(startAfter);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  const canLoadMore = nextCursor !== null && !isLoading && !error;

  // useCallback : la même fonction tant que fetchPage ne change pas (l'effet ci-dessous en dépend)
  const loadPage = useCallback((after) => {
    setIsLoading(true);
    fetchPage(after)
      .then((page) => {
        setItems((previous) => [...previous, ...page.items]);
        setNextCursor(page.nextCursor);
      })
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setIsLoading(false));
  }, [fetchPage]);

  // Surveille la sentinelle. Le premier chargement passe aussi par ici :
  // au départ la liste est vide, donc la sentinelle est déjà visible.
  useEffect(() => {
    if (!canLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        // On arrête d'observer tout de suite : une seule page chargée à la fois
        observer.disconnect();
        loadPage(nextCursor);
      },
      { rootMargin: PRELOAD_DISTANCE },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, nextCursor, loadPage]);

  return {
    items,
    sentinelRef,
    isLoading,
    error,
    isFinished: nextCursor === null,
    // Réessayer = effacer l'erreur : canLoadMore redevient vrai et l'observateur relance le chargement
    retry: () => setError(null),
  };
}
