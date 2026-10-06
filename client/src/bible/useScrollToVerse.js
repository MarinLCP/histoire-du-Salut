// Hook React : arrivé par un lien vers un verset (ex. un parallèle), la lecture défile jusqu'à lui dès qu'il
// est affiché, le place au milieu de l'écran et le fait briller un instant (classe verse-arrival).
// Une seule fois : ensuite, le lecteur défile librement.

import { useEffect, useRef } from 'react';

// targetKey : la référence du verset visé ("Ml 3,23"), ou null ; shownCount : le nombre de chapitres
// affichés (le verset peut arriver avec une page suivante)
export function useScrollToVerse(targetKey, shownCount) {
  const isDoneRef = useRef(false);

  useEffect(() => {
    if (!targetKey || isDoneRef.current) return;
    // Une référence n'a ni guillemet ni antislash : elle peut aller telle quelle dans le sélecteur
    const element = document.querySelector(`[data-verse="${targetKey}"]`);
    if (!element) return;

    isDoneRef.current = true;
    element.scrollIntoView({ block: 'center' });
    element.classList.add('verse-arrival');
    element.addEventListener('animationend', () => element.classList.remove('verse-arrival'), { once: true });
  }, [targetKey, shownCount]);
}
