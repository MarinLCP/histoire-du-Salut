// Logique des surlignages : fonctions pures (ni React, ni navigateur), faciles à tester.
// Les surlignages sont une Map : référence du verset ("Gn 1,3", voir bible/reference.js) -> { createdAt }.

// Renvoie une NOUVELLE Map (on ne modifie jamais celle reçue) :
// le verset est retiré s'il était surligné, ajouté sinon.
// La date servira à fusionner avec les surlignages du compte, le jour où il y en aura (V4.4).
export function toggleHighlight(highlights, key, now = new Date()) {
  const next = new Map(highlights);

  if (next.has(key)) {
    next.delete(key);
    return next;
  }

  next.set(key, { createdAt: now.toISOString() });
  return next;
}
