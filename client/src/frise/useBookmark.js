// Hook React : le marque-page d'une lecture ('history' ou 'bible'), dans le compte ou le navigateur
// (BookmarksContext, rempli par App).
// - bookmark : où on s'était arrêté à la visite précédente (lu une fois, au premier affichage), ou null ;
// - forget() : on y est retourné, il n'est plus montré ;
// - pendant la lecture, la position est retenue pour la prochaine visite. Pas tant qu'on n'a pas bougé :
//   ouvrir l'app (au début, ou par un lien) ne doit pas écraser le marque-page.

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadBookmarks } from './bookmark.storage.js';
import { BookmarksContext } from '../library/BookmarksContext.js';

// On retient la position une fois la lecture posée (pas à chaque image du défilement)
const SAVE_DELAY = 1500;

export function useBookmark(mode, readingAt) {
  const { saved, save } = useContext(BookmarksContext);
  // Sans App (tests de la frise) : ceux du navigateur, lus une fois
  const [localSaved] = useState(loadBookmarks);
  const [isForgotten, setIsForgotten] = useState(false);
  const firstPosition = useRef(null);
  const bookmark = isForgotten ? null : ((saved ?? localSaved).get(mode) ?? null);

  useEffect(() => {
    if (readingAt === null) return;
    firstPosition.current ??= readingAt;
    if (readingAt === firstPosition.current) return;

    const timer = setTimeout(() => save(mode, readingAt), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [mode, readingAt, save]);

  const forget = useCallback(() => setIsForgotten(true), []);
  return { bookmark, forget };
}
