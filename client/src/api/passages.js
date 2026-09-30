// Appels à l'API des passages.
// Les composants passent par ces fonctions au lieu d'appeler fetch directement.

// Renvoie { passages, nextCursor } : les passages qui suivent la position `after`
export async function fetchTimeline(after) {
  let response;
  try {
    response = await fetch(`/api/timeline?after=${after}`);
  } catch {
    // fetch lève une erreur seulement quand le serveur est injoignable (réseau coupé, API arrêtée)
    throw new Error('Impossible de joindre le serveur. Vérifie ta connexion.');
  }

  // fetch ne lève pas d'erreur sur un 404 ou un 500 : il faut vérifier nous-mêmes
  if (!response.ok) {
    throw new Error(await errorMessageFrom(response));
  }
  return response.json();
}

// Le serveur renvoie { error: "..." } sur ses erreurs 400/404 : on réutilise son message.
// Sinon (ex. une 500 sans corps JSON), un message générique.
async function errorMessageFrom(response) {
  const body = await response.json().catch(() => null);
  return body?.error ?? `Le chargement a échoué (erreur ${response.status}).`;
}
