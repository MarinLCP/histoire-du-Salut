// Hook React : Échap appelle onClose (tant que isActive est vrai). Sauf si une fenêtre <dialog> est ouverte
// par-dessus (ex. le menu d'un verset) : Échap ne referme alors qu'elle (le navigateur s'en charge).
// Utilisé par le panneau fixé à droite (DockedPanel) et par le panneau de la frise sur téléphone
// (ReadingWithFrise). onClose : la même fonction d'un affichage à l'autre (useCallback), sinon l'écoute est
// refaite à chaque fois.

import { useEffect } from 'react';

export function useCloseOnEscape(onClose, isActive = true) {
  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, isActive]);
}
