// Hook React : faire sauter la lecture à une position (passage ou chapitre), depuis un clic dans la frise.
// - Déjà chargé dans la page : on y saute directement (readingPosition.js).
// - Pas encore chargé : la liste doit recommencer juste avant son élément (jumpStart = n° de l'élément - 1),
//   en haut de l'écran (position peut être fractionnaire : 20.47 = dans l'élément n° 20).
// resetKey : le saut ne vaut que pour cette adresse ; une nouvelle navigation (ex. « Revenir au début ») l'oublie.
// Renvoie [jumpStart, jumpTo] : jumpStart vaut null tant qu'aucun saut n'a demandé de recommencer la liste.

import { useCallback, useState } from 'react';
import { jumpToReadingPosition } from './readingPosition.js';

export function useJump(resetKey = '') {
  const [jump, setJump] = useState({ resetKey, start: null });

  // useCallback : la même fonction d'un affichage à l'autre, pour que la frise (memo) ne se redessine pas
  const jumpTo = useCallback((position) => {
    if (jumpToReadingPosition(position)) return;
    setJump({ resetKey, start: Math.floor(position) - 1 });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [resetKey]);

  return [jump.resetKey === resetKey ? jump.start : null, jumpTo];
}
