// Le marque-page de chaque lecture, partagé avec la frise (qui l'affiche) sans le passer de composant en
// composant : un « contexte » React. App le remplit (useLibrary) : le compte si on est connecté, sinon le
// navigateur. Sans App (ex. dans les tests de la frise) : le navigateur seulement.
// - saved : les marque-pages au chargement (Map : 'history' | 'bible' -> position), ou null = les lire dans
//   le navigateur ; ils ne bougent pas pendant la lecture (le ruban montre la visite précédente) ;
// - save(mode, position) : retenir où on en est.

import { createContext } from 'react';
import { saveBookmark } from '../frise/bookmark.storage.js';

export const BookmarksContext = createContext({ saved: null, save: saveBookmark });
