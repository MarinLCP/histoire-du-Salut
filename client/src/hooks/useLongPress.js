// Hook React : détecte un appui long (doigt ou souris) sur un élément.
// Le web n'a pas d'événement "appui long" : on lance un minuteur au contact,
// et on l'annule si le doigt se lève trop tôt ou bouge (l'utilisateur scrolle).
// Le clic droit (ordinateur, et appui long sur Android) déclenche aussi l'action.
// Usage : <p {...useLongPress(openMenu)}>

import { useEffect, useRef } from 'react';
import { LONG_PRESS_DELAY, hasMovedTooFar } from './longPress.js';

export function useLongPress(onLongPress) {
  const timerRef = useRef(null);
  const startRef = useRef(null);

  function cancel() {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  // Si l'élément disparaît pendant un appui, on arrête le minuteur
  useEffect(() => cancel, []);

  function onPointerDown(event) {
    // Seulement le bouton principal (clic gauche ou doigt) : le clic droit passe par onContextMenu
    if (event.button !== 0) return;
    startRef.current = { x: event.clientX, y: event.clientY };
    timerRef.current = setTimeout(onLongPress, LONG_PRESS_DELAY);
  }

  function onPointerMove(event) {
    if (timerRef.current === null) return;
    if (!hasMovedTooFar(startRef.current, { x: event.clientX, y: event.clientY })) return;
    cancel();
  }

  function onContextMenu(event) {
    // Remplace le menu natif du navigateur par le nôtre
    event.preventDefault();
    cancel();
    onLongPress();
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    // Le navigateur annule le "pointer" quand il prend la main pour scroller
    onPointerCancel: cancel,
    onContextMenu,
  };
}
