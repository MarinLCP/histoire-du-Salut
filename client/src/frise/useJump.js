// Hook React : faire sauter la lecture à une position (passage ou chapitre), depuis un clic dans la frise ou
// à l'ouverture (reprendre sa lecture).
// - Déjà chargé dans la page : on y saute directement (readingPosition.js).
// - Pas encore chargé : la liste doit recommencer juste avant son élément (jumpStart = n° de l'élément - 1).
//   Une fois l'élément arrivé dans la page, on va à la position exacte dedans (20.47 = à 47 % du n° 20).
// Le saut ne vaut que jusqu'à la prochaine navigation (ex. « Revenir au début », un lien de la barre) :
// location.key change à chaque navigation, même vers la même adresse.
// Renvoie [jumpStart, jumpTo] : jumpStart vaut null tant qu'aucun saut n'a demandé de recommencer la liste.

import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { jumpToReadingPosition } from './readingPosition.js';

export function useJump() {
  const { key: resetKey } = useLocation();
  const [jump, setJump] = useState({ resetKey, start: null, position: null });
  const isCurrent = jump.resetKey === resetKey;
  const pending = isCurrent ? jump.position : null;

  // useCallback : la même fonction d'un affichage à l'autre, pour que la frise (memo) ne se redessine pas
  const jumpTo = useCallback((position) => {
    if (jumpToReadingPosition(position)) return;
    setJump({ resetKey, start: Math.floor(position) - 1, position });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [resetKey]);

  // La liste recommence : on guette l'arrivée de l'élément dans la page, puis on va à la position exacte
  useEffect(() => {
    if (pending === null) return;
    const observer = new MutationObserver(() => {
      if (jumpToReadingPosition(pending)) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pending]);

  return [isCurrent ? jump.start : null, jumpTo];
}
