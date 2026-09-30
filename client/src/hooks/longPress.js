// Règles de l'appui long, séparées du hook React pour pouvoir les tester seules.

// Durée à partir de laquelle un toucher devient un appui long (en millisecondes)
export const LONG_PRESS_DELAY = 500;

// Au-delà de ce déplacement (en pixels), le doigt ne "reste" plus : l'utilisateur scrolle
const MOVE_TOLERANCE = 10;

// start et current : positions { x, y } du doigt au début et maintenant
export function hasMovedTooFar(start, current) {
  const distance = Math.hypot(current.x - start.x, current.y - start.y);
  return distance > MOVE_TOLERANCE;
}
