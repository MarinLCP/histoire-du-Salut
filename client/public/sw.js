// Le service worker de l'application (V12.3) : un petit programme que le navigateur garde dans le téléphone et
// qui passe entre le site et le réseau. Il garde une copie de ce qu'il faut pour rouvrir l'app et relire sans
// réseau. Écrit à la main, sans bibliothèque. Trois règles :
// - les pages (une adresse du site ouverte) : le réseau d'abord (toujours la dernière version du site), la copie
//   si pas de réseau ;
// - les fichiers du site dont le nom change à chaque version (/assets/index-CBlekNfX.js...), la police et les
//   icônes : la copie d'abord (ils ne changent jamais sous le même nom) ;
// - les textes et la frise (l'API publique, la même pour tous) : le réseau d'abord, la copie si pas de réseau.
// Jamais en copie : tout ce qui est propre au lecteur (compte, session, notes, partage) : ces adresses ne passent
// pas par ici.
// Une nouvelle version de ce fichier remplace l'ancienne dès qu'elle est installée (skipWaiting) ; les copies des
// anciennes versions sont effacées (activate).

const VERSION = 1;
const SITE_CACHE = `site-v${VERSION}`;
const READING_CACHE = `lecture-v${VERSION}`;
// Au-delà, les textes les plus anciennement gardés sont oubliés (la Bible entière ne tient pas dans un téléphone)
const MAX_READINGS = 300;

// L'API publique : les textes (épisodes, Bible, chapitres, parallèles) et la frise
const PUBLIC_API = ['/api/passages/', '/api/timeline', '/api/bible', '/api/books/', '/api/overview/'];
// Gardés une fois pour toutes : leur nom change quand ils changent
const LASTING_FILES = ['/assets/', '/fonts/', '/icons/'];

// À l'installation : la page d'accueil et les fichiers qu'elle charge, pour que l'app se rouvre sans réseau
// dès la deuxième fois
self.addEventListener('install', (event) => {
  event.waitUntil(keepHomePage());
  self.skipWaiting();
});

// À l'activation : on oublie les copies des versions précédentes, et on prend la main sur les pages ouvertes
self.addEventListener('activate', (event) => {
  event.waitUntil(forgetOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const strategy = strategyFor(event.request);
  if (strategy) event.respondWith(strategy(event.request));
});

// Quelle règle pour cette requête (null : le service worker ne s'en mêle pas, le navigateur fait comme d'habitude)
function strategyFor(request) {
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return null;
  // Les allers-retours de connexion (/api/auth/google...) sont des pages aussi : jamais gardés
  if (request.mode === 'navigate') return url.pathname.startsWith('/api/') ? null : pageFirstFromNetwork;
  if (LASTING_FILES.some((path) => url.pathname.startsWith(path))) return fromCopyFirst;
  if (PUBLIC_API.some((path) => url.pathname.startsWith(path))) return readingFromNetworkFirst;
  return null;
}

// Une page : le réseau (et on garde la copie de la page d'accueil) ; sans réseau, la copie. Toutes les adresses
// du site (/, /bible, /confidentialite...) ont la même page : c'est React qui affiche la bonne
async function pageFirstFromNetwork(request) {
  try {
    const response = await fetch(request);
    if (response.ok && isHtml(response)) (await caches.open(SITE_CACHE)).put('/', response.clone());
    return response;
  } catch {
    return (await caches.match('/')) ?? Response.error();
  }
}

const isHtml = (response) => (response.headers.get('content-type') ?? '').includes('text/html');

async function fromCopyFirst(request) {
  const copy = await caches.match(request);
  if (copy) return copy;
  const response = await fetch(request);
  if (response.ok) (await caches.open(SITE_CACHE)).put(request, response.clone());
  return response;
}

async function readingFromNetworkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) await keepReading(request, response.clone());
    return response;
  } catch (error) {
    const copy = await caches.match(request);
    if (copy) return copy;
    throw error;
  }
}

// Garde un texte lu, en oubliant les plus anciens au-delà de MAX_READINGS
async function keepReading(request, response) {
  const cache = await caches.open(READING_CACHE);
  await cache.put(request, response);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_READINGS)).map((key) => cache.delete(key)));
}

// La page d'accueil et les fichiers qu'elle charge (/assets/..., trouvés dans son HTML)
async function keepHomePage() {
  const response = await fetch('/');
  if (!response.ok) return;
  const html = await response.clone().text();
  const files = [...new Set(html.match(/\/assets\/[^"']+/g) ?? [])];
  const cache = await caches.open(SITE_CACHE);
  await cache.put('/', response);
  await cache.addAll(files);
}

async function forgetOldCaches() {
  const current = [SITE_CACHE, READING_CACHE];
  const names = await caches.keys();
  await Promise.all(names.filter((name) => !current.includes(name)).map((name) => caches.delete(name)));
}
