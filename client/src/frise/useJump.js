// Hook React : faire sauter la lecture à une position (passage ou chapitre), depuis un clic dans la frise.
// - Déjà chargé dans la page : on y saute directement (readingPosition.js).
// - Pas encore chargé : la liste doit recommencer juste avant son élément (jumpStart = n° de l'élément - 1),
//   en haut de l'écran (position peut être fractionnaire : 20.47 = dans l'élément n° 20).
// Le saut ne vaut que jusqu'à la prochaine navigation (ex. « Revenir au début », un lien de la barre) :
// location.key change à chaque navigation, même vers la même adresse.
// Renvoie [jumpStart, jumpTo] : jumpStart vaut null tant qu'aucun saut n'a demandé de recommencer la liste.

import { useCallback, useState } from 'react';
import { useLocation } from 'react-router';
import { jumpToReadingPosition } from './readingPosition.js';

export function useJump() {
  const { key: resetKey } = useLocation();
  const [jump, setJump] = useState({ resetKey, start: null });

  // useCallback : la même fonction d'un affichage à l'autre, pour que la frise (memo) ne se redessine pas
  const jumpTo = useCallback((position) => {
    if (jumpToReadingPosition(position)) return;
    setJump({ resetKey, start: Math.floor(position) - 1 });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [resetKey]);

  return [jump.resetKey === resetKey ? jump.start : null, jumpTo];
}
