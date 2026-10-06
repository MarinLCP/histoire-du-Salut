// Hook React : le marque-page d'une lecture ('history' ou 'bible').
// - bookmark : où on s'était arrêté à la visite précédente (lu une fois, au premier affichage), ou null ;
// - forget() : on y est retourné, il n'est plus montré ;
// - pendant la lecture, la position est retenue pour la prochaine visite. Pas tant qu'on n'a pas bougé :
//   ouvrir l'app (au début, ou par un lien) ne doit pas écraser le marque-page.

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadBookmarks, saveBookmark } from './bookmark.storage.js';

// On retient la position une fois la lecture posée (pas à chaque image du défilement)
const SAVE_DELAY = 1500;

export function useBookmark(mode, readingAt) {
  const [bookmark, setBookmark] = useState(() => loadBookmarks().get(mode) ?? null);
  const firstPosition = useRef(null);

  useEffect(() => {
    if (readingAt === null) return;
    firstPosition.current ??= readingAt;
    if (readingAt === firstPosition.current) return;

    const timer = setTimeout(() => saveBookmark(mode, readingAt), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [mode, readingAt]);

  const forget = useCallback(() => setBookmark(null), []);
  return { bookmark, forget };
}
