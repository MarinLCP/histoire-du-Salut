// Les marque-pages posés à la main, partagés avec la frise (qui les affiche) et les versets, sans les passer
// de composant en composant : un « contexte » React. App le remplit (useLibrary) : le compte si on est
// connecté, sinon le navigateur. Sans App (ex. dans les tests de la frise) : le navigateur seulement.
// - saved : Map 'history' | 'bible' -> { position, verse }, ou null = les lire dans le navigateur.

import { createContext } from 'react';

export const BookmarksContext = createContext({ saved: null });
