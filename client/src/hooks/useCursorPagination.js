// Hook React : une liste chargée page par page au fil du défilement (pagination par curseur).
// Utilisé par la timeline de l'histoire du salut et par la Bible entière.
// Un élément invisible (la "sentinelle", sentinelRef) est placé tout en bas de la liste :
// quand il approche de l'écran, on charge la page suivante. Les pages elles-mêmes : useCursorPages.

import { useEffect, useRef } from 'react';
import { useCursorPages } from './useCursorPages.js';

// On charge la suite un peu AVANT que l'utilisateur n'arrive en bas (600px avant)
const PRELOAD_DISTANCE = '600px';

/**
 * @param {(after: number) => Promise<{ items: object[], nextCursor: number | null }>} fetchPage
 * @param {number} startAfter - la position après laquelle commencer (0 = depuis le début)
 */
export function useCursorPagination(fetchPage, startAfter) {
  const { items, nextCursor, isLoading, error, isFinished, canLoadMore, loadPage, clearError } =
    useCursorPages(fetchPage, startAfter);
  const sentinelRef = useRef(null);

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

  // Réessayer = effacer l'erreur : canLoadMore redevient vrai et l'observateur relance le chargement
  return { items, sentinelRef, isLoading, error, isFinished, retry: clearError };
}
