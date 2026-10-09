// Hook React : la pile des retours (« Revenir à … ») de la page affichée.
// Chaque parallèle ouvert y ajoute son verset de départ ; elle voyage dans l'état de la navigation
// (location.state.returnStack). Le lecteur peut l'abandonner : la croix du bouton, ou un saut dans la frise
// (il a choisi d'aller ailleurs). Pas de nouvelle navigation pour ça (elle recommencerait la lecture) : on
// retient la pile abandonnée, ici, et elle compte pour vide. Un retour en arrière du navigateur la retrouve.
// Renvoie { stack, dismiss } : stack, du plus ancien au plus récent ; dismiss() l'abandonne.

import { useCallback, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';

const NO_RETURN = [];
// La pile abandonnée (le même objet que dans l'état de la navigation), et qui l'écoute
let dismissedStack = null;
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReturnStack() {
  const stateStack = useLocation().state?.returnStack ?? NO_RETURN;
  const dismissed = useSyncExternalStore(subscribe, () => dismissedStack);

  const dismiss = useCallback(() => {
    if (stateStack === NO_RETURN) return;
    dismissedStack = stateStack;
    listeners.forEach((listener) => listener());
  }, [stateStack]);

  return { stack: stateStack === dismissed ? NO_RETURN : stateStack, dismiss };
}
