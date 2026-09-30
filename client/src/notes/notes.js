// Logique des notes personnelles : fonctions pures (ni React, ni navigateur), faciles à tester.
// Les notes sont une Map : référence du verset ("Gn 1,3") -> { text, updatedAt }.

// Renvoie une NOUVELLE Map (on ne modifie jamais celle reçue).
// Une note vide (ou seulement des espaces) supprime la note du verset.
export function setNote(notes, key, text, now = new Date()) {
  const next = new Map(notes);

  if (text.trim() === '') {
    next.delete(key);
    return next;
  }

  next.set(key, { text, updatedAt: now.toISOString() });
  return next;
}
