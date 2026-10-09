// Où le lecteur en est dans chaque lecture, partagé avec la mise en page des lectures (useReadingMemory) : un
// « contexte » React, rempli par App (useLibrary). Sans App (ex. tests des pages) : cet appareil seulement.
// - latest(mode) : la position où revenir à l'ouverture (null : aucune ; undefined : pas encore sue, le compte
//   se charge) ;
// - save(mode, position) : retenir où on en est ;
// - resumed : les lectures déjà reprises depuis l'ouverture de l'app (on n'y revient qu'une fois).

import { createContext } from 'react';
import { loadReadingPositions, saveReadingPosition } from '../frise/readingPositions.storage.js';

export const ReadingPositionsContext = createContext({
  latest: (mode) => loadReadingPositions().get(mode)?.position ?? null,
  save: saveReadingPosition,
  resumed: new Set(),
});
