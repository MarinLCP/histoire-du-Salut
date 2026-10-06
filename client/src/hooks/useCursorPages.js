// Hook React : une liste chargée page par page (pagination par curseur), sans dire QUAND charger la suite.
// Partagé par le défilement continu (useCursorPagination : timeline, Bible entière) et par le bouton
// « Voir plus » des parallèles (useParallels).
// Une page n'est gardée que si elle continue la liste là où elle en est : une réponse en double (l'effet
// lancé deux fois en dev par le StrictMode) ou périmée est ignorée.

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * @param {(after: number) => Promise<{ items: object[], nextCursor: number | null }>} fetchPage
 *   - à définir hors du composant (ou useCallback) : sinon le premier chargement recommencerait
 * @param {number} startAfter - la position après laquelle commencer (0 = depuis le début)
 * @param {{ loadFirstPage?: boolean }} [options] - loadFirstPage : charger la première page dès l'affichage
 */
export function useCursorPages(fetchPage, startAfter, { loadFirstPage = false } = {}) {
  const [items, setItems] = useState([]);
  // Position après laquelle charger la page suivante ; null = on est arrivé au bout
  const [nextCursor, setNextCursor] = useState(startAfter);
  const [isLoading, setIsLoading] = useState(loadFirstPage);
  const [error, setError] = useState(null);
  // La même position, lue sans attendre le prochain affichage (pour reconnaître une réponse en trop)
  const cursorRef = useRef(startAfter);

  const receivePage = useCallback((after) => {
    fetchPage(after)
      .then((page) => {
        if (after !== cursorRef.current) return;
        cursorRef.current = page.nextCursor;
        setItems((previous) => [...previous, ...page.items]);
        setNextCursor(page.nextCursor);
        setIsLoading(false);
      })
      .catch((fetchError) => {
        if (after !== cursorRef.current) return;
        setError(fetchError.message);
        setIsLoading(false);
      });
  }, [fetchPage]);

  useEffect(() => {
    if (loadFirstPage) receivePage(startAfter);
  }, [loadFirstPage, receivePage, startAfter]);

  // Charger la page qui suit `after` (en pratique : nextCursor)
  const loadPage = useCallback((after) => {
    setIsLoading(true);
    setError(null);
    receivePage(after);
  }, [receivePage]);

  return {
    items,
    nextCursor,
    isLoading,
    error,
    isFinished: nextCursor === null,
    canLoadMore: nextCursor !== null && !isLoading && !error,
    loadPage,
    clearError: () => setError(null),
  };
}
