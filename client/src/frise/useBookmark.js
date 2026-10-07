// Hook React : le marque-page d'une lecture ('history' ou 'bible'), dans le compte ou le navigateur
// (BookmarksContext, rempli par App).
// - bookmark : la position où il est (lue au premier affichage, ou là où le lecteur l'a posé), ou null ;
// - forget() : on y est retourné, il n'est plus montré (sauf s'il a été posé à la main : il reste) ;
// - pendant la lecture, la position est retenue pour la prochaine visite. Pas tant qu'on n'a pas bougé :
//   ouvrir l'app (au début, ou par un lien) ne doit pas écraser le marque-page. Jamais s'il a été posé à la
//   main : il ne bouge plus tout seul.

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { isPlaced as isPlacedBookmark, loadBookmarks } from './bookmark.storage.js';
import { BookmarksContext } from '../library/BookmarksContext.js';

// On retient la position une fois la lecture posée (pas à chaque image du défilement)
const SAVE_DELAY = 1500;

export function useBookmark(mode, readingAt) {
  const { saved, save } = useContext(BookmarksContext);
  // Sans App (tests de la frise) : ceux du navigateur, lus une fois (avec App : jamais, saved les donne)
  const [localSaved] = useState(() => (saved ? null : loadBookmarks()));
  const [isForgotten, setIsForgotten] = useState(false);
  const firstPosition = useRef(null);
  const entry = (saved ?? localSaved).get(mode) ?? null;
  const isPlaced = isPlacedBookmark(entry);
  const bookmark = entry && (isPlaced || !isForgotten) ? entry.position : null;

  useEffect(() => {
    if (readingAt === null) return;
    firstPosition.current ??= readingAt;
    if (isPlaced || readingAt === firstPosition.current) return;

    const timer = setTimeout(() => save(mode, readingAt), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [mode, readingAt, save, isPlaced]);

  const forget = useCallback(() => setIsForgotten(true), []);
  return { bookmark, forget };
}
