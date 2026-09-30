// Appels à l'API des passages.
// Les composants passent par ces fonctions au lieu d'appeler fetch directement.

// Renvoie { passages, nextCursor } : les passages qui suivent la position `after`
export async function fetchTimeline(after) {
  const response = await fetch(`/api/timeline?after=${after}`);

  // fetch ne lève pas d'erreur sur un 404 ou un 500 : il faut vérifier nous-mêmes
  if (!response.ok) {
    throw new Error(`Impossible de charger les passages (erreur ${response.status}).`);
  }
  return response.json();
}
