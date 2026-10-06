// Liens directs vers un passage, et liens de progression : fonctions pures, faciles à tester.
// Formats : https://site/?passage=creation (le slug du passage dans l'adresse) ;
//           https://site/progression/<jeton> (où en est un lecteur, partagé par lui)

const PARAMETER = 'passage';

// origin : le début de l'adresse du site, ex. "https://histoire-du-salut.fr"
export function passageLink(origin, slug) {
  return `${origin}/?${PARAMETER}=${encodeURIComponent(slug)}`;
}

// search : la partie "?..." de l'adresse (window.location.search). Renvoie le slug, ou null.
export function readSharedSlug(search) {
  const slug = new URLSearchParams(search).get(PARAMETER);
  return slug === '' ? null : slug;
}

// Le lien de partage de progression d'un lecteur (le jeton vient du serveur)
export function progressLink(origin, token) {
  return `${origin}/progression/${encodeURIComponent(token)}`;
}
