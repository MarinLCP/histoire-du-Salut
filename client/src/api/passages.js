// Appels à l'API des passages.
// Les composants passent par ces fonctions au lieu d'appeler fetch directement.

export async function fetchPassage(id) {
  const response = await fetch(`/api/passages/${id}`);

  // fetch ne lève pas d'erreur sur un 404 ou un 500 : il faut vérifier nous-mêmes
  if (!response.ok) {
    throw new Error(`Impossible de charger le passage ${id} (erreur ${response.status}).`);
  }
  return response.json();
}
