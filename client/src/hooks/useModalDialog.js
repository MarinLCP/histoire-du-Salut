// Hook React : une fenêtre <dialog> modale, ouverte dès son affichage (le navigateur gère le fond grisé,
// la touche Échap et le focus), et refermée quand on touche le fond grisé autour du panneau.
// L'appui doit COMMENCER sur le fond : sinon, le doigt qui se lève à la fin d'un appui long
// (la fenêtre vient de s'ouvrir sous lui) la refermerait aussitôt.
// Utilisé par le menu d'un verset et par le panneau Paramètres.
// Renvoie { dialogRef, backdropProps } : la référence à poser sur <dialog>, et ses gestionnaires d'appui.

import { useEffect, useRef } from 'react';

export function useModalDialog(onClose) {
  const dialogRef = useRef(null);
  const pressStartedOnBackdropRef = useRef(false);
  // Le panneau a un contenu sans marge interne : un clic sur <dialog> lui-même est forcément sur le fond
  const isBackdrop = (event) => event.target === dialogRef.current;

  useEffect(() => {
    // En dev, le StrictMode lance cet effet deux fois : on n'ouvre que si ce n'est pas déjà fait
    if (!dialogRef.current.open) dialogRef.current.showModal();
  }, []);

  const backdropProps = {
    onPointerDown: (event) => {
      pressStartedOnBackdropRef.current = isBackdrop(event);
    },
    onClick: (event) => {
      if (pressStartedOnBackdropRef.current && isBackdrop(event)) onClose();
    },
  };
  return { dialogRef, backdropProps };
}
