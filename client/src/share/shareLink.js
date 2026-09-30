// Liens directs vers un passage : fonctions pures, faciles à tester.
// Format : https://site/?passage=creation (le slug du passage dans l'adresse)

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
