// Appels à l'API, avec des messages d'erreur clairs (partagé par les modules d'API).

// Lit une réponse JSON (GET)
export async function getJson(url) {
  return readResponse(await reach(() => fetch(url)));
}

// Envoie des données en JSON (POST, PUT, DELETE...). Renvoie la réponse lue, ou null si elle est vide (204).
export async function sendJson(method, url, body) {
  const options = { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) };
  return readResponse(await reach(() => fetch(url, options)));
}

// fetch lève une erreur seulement quand le serveur est injoignable (réseau coupé, API arrêtée)
function reach(call) {
  return call().catch(() => {
    throw new Error('Impossible de joindre le serveur. Vérifie ta connexion.');
  });
}

async function readResponse(response) {
  // fetch ne lève pas d'erreur sur un 404 ou un 500 : il faut vérifier nous-mêmes
  if (!response.ok) {
    throw new Error(await errorMessageFrom(response));
  }
  if (response.status === 204) return null;
  return response.json();
}

// Le serveur renvoie { error: "..." } sur ses erreurs 400/401/404... : on réutilise son message.
// Sinon (ex. une 500 sans corps JSON), un message générique.
async function errorMessageFrom(response) {
  const body = await response.json().catch(() => null);
  return body?.error ?? `Le chargement a échoué (erreur ${response.status}).`;
}
