// Les marque-pages de chaque lecture, partagés avec la frise (qui les affiche) et les versets, sans les passer
// de composant en composant : un « contexte » React. App le remplit (useLibrary) : le compte si on est
// connecté, sinon le navigateur. Sans App (ex. dans les tests de la frise) : le navigateur seulement.
// - saved : Map 'history' | 'bible' -> { position, verse }, ou null = les lire dans le navigateur. Ceux qui
//   suivent la lecture ne bougent pas pendant la lecture (le ruban montre la visite précédente) ;
// - save(mode, position) : retenir où on en est (useBookmark ne le fait pas si le marque-page est posé à la main).

import { createContext } from 'react';
import { saveBookmark } from '../frise/bookmark.storage.js';

export const BookmarksContext = createContext({
  saved: null,
  save: (mode, position) => saveBookmark(mode, { position, verse: null }),
});
