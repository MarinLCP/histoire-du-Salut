// Hook React : les parallèles d'un verset, chargés 10 par 10 (les plus votés d'abord) :
// la première page à l'ouverture, les suivantes avec le bouton « Voir plus » (loadMore).

import { useCallback } from 'react';
import { fetchParallels } from '../api/bible.api.js';
import { useCursorPages } from '../hooks/useCursorPages.js';

const FIRST_PAGE = 0;

// reference : le verset, { book, chapter, verse } (le même objet d'un affichage à l'autre)
export function useParallels(reference) {
  const fetchPage = useCallback(
    (after) => fetchParallels(reference, after).then((page) => ({ items: page.parallels, nextCursor: page.nextCursor })),
    [reference],
  );
  const { items, nextCursor, isLoading, error, canLoadMore, loadPage } =
    useCursorPages(fetchPage, FIRST_PAGE, { loadFirstPage: true });

  return {
    parallels: items,
    isLoading,
    error,
    canLoadMore,
    // « Voir plus », et aussi « Réessayer » après une erreur : la page qui a échoué est redemandée
    loadMore: () => loadPage(nextCursor),
  };
}
