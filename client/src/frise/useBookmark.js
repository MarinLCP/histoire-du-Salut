// Hook React : la position du marque-page posé à la main dans une lecture ('history' ou 'bible'), dans le compte
// ou le navigateur (BookmarksContext, rempli par App), ou null s'il n'y en a pas. Il ne bouge pas avec la
// lecture : seul le lecteur le pose ou le retire (menu d'un verset).

import { useContext, useState } from 'react';
import { loadBookmarks } from './bookmark.storage.js';
import { BookmarksContext } from '../library/BookmarksContext.js';

export function useBookmark(mode) {
  const { saved } = useContext(BookmarksContext);
  // Sans App (tests de la frise) : ceux du navigateur, lus une fois (avec App : jamais, saved les donne)
  const [localSaved] = useState(() => (saved ? null : loadBookmarks()));
  return (saved ?? localSaved).get(mode)?.position ?? null;
}
