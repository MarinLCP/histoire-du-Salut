// Tests du service worker (public/sw.js) : on le fait tourner dans un bac à sable, avec un faux réseau et un faux
// cache, et on vérifie ses règles : rien de privé n'est gardé, les textes se relisent sans réseau, l'app se
// rouvre sans réseau, les copies des anciennes versions sont effacées.

import { describe, test, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const SOURCE = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://lerouleau.com';

// Un faux CacheStorage : des caches nommés, chacun une Map adresse -> réponse
function fakeCaches() {
  const stores = new Map();
  const keyOf = (request) => (typeof request === 'string' ? new URL(request, ORIGIN).href : request.url);
  const open = async (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      put: async (request, response) => { store.set(keyOf(request), response); },
      keys: async () => [...store.keys()].map((url) => ({ url })),
      delete: async (request) => store.delete(keyOf(request)),
      addAll: async (urls) => { for (const url of urls) store.set(keyOf(url), new Response(`copie de ${url}`)); },
    };
  };
  return {
    stores,
    open,
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    match: async (request) => {
      for (const store of stores.values()) if (store.has(keyOf(request))) return store.get(keyOf(request));
      return undefined;
    },
  };
}

// Le service worker chargé, avec ses gestionnaires d'événements ; network : ce que répond le faux réseau
function loadServiceWorker() {
  const handlers = {};
  const network = { online: true, calls: [], pages: { '/': '<script src="/assets/index-abc.js"></script>' } };
  const caches = fakeCaches();
  const fetch = async (request) => {
    const url = typeof request === 'string' ? request : request.url;
    network.calls.push(url);
    if (!network.online) throw new TypeError('Pas de réseau');
    const path = new URL(url, ORIGIN).pathname;
    const isPage = path in network.pages;
    return new Response(isPage ? network.pages[path] : `réseau : ${path}`, {
      headers: { 'content-type': isPage ? 'text/html' : 'application/json' },
    });
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type, handler) => { handlers[type] = handler; },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
  };
  runInNewContext(SOURCE, { self, caches, fetch, URL, Response, Promise, Set, Math, TypeError });
  return { handlers, network, caches };
}

// Une requête du navigateur ; renvoie la réponse du service worker, ou null s'il ne s'en mêle pas
async function request(sw, path, { mode = 'cors', method = 'GET' } = {}) {
  let answer = null;
  sw.handlers.fetch({ request: { url: ORIGIN + path, mode, method }, respondWith: (promise) => { answer = promise; } });
  return answer && (await answer);
}

// Les événements « install » et « activate » : on attend leur travail (waitUntil)
async function lifecycle(sw, type) {
  let work;
  sw.handlers[type]({ waitUntil: (promise) => { work = promise; } });
  await work;
}

describe('service worker', () => {
  let sw;
  beforeEach(() => {
    sw = loadServiceWorker();
  });

  test.each(['/api/me/library', '/api/session', '/api/account', '/api/progress/abc', '/api/auth/options'])(
    'rien de privé ne passe par lui : %s', async (path) => {
      expect(await request(sw, path)).toBeNull();
    },
  );

  test('les écritures (POST...) et les connexions Google ne passent pas par lui', async () => {
    expect(await request(sw, '/api/passages/creation', { method: 'POST' })).toBeNull();
    expect(await request(sw, '/api/auth/google/callback?code=x', { mode: 'navigate' })).toBeNull();
  });

  test('un texte lu une fois se relit sans réseau', async () => {
    expect(await (await request(sw, '/api/passages/creation')).text()).toBe('réseau : /api/passages/creation');

    sw.network.online = false;

    expect(await (await request(sw, '/api/passages/creation')).text()).toBe('réseau : /api/passages/creation');
    await expect(request(sw, '/api/passages/jamais-lu')).rejects.toThrow('Pas de réseau');
  });

  test('avec du réseau, toujours la dernière version du texte', async () => {
    await request(sw, '/api/timeline?after=0');
    await request(sw, '/api/timeline?after=0');

    expect(sw.network.calls.filter((url) => url.endsWith('/api/timeline?after=0'))).toHaveLength(2);
  });

  test('installée, l\'app se rouvre sans réseau : la page d\'accueil et ses fichiers sont gardés', async () => {
    await lifecycle(sw, 'install');
    sw.network.online = false;

    const page = await request(sw, '/bible', { mode: 'navigate' });
    const script = await request(sw, '/assets/index-abc.js');

    expect(await page.text()).toContain('/assets/index-abc.js');
    expect(await script.text()).toBe('copie de /assets/index-abc.js');
  });

  test('les fichiers du site (nom qui change à chaque version) : la copie d\'abord, sans redemander', async () => {
    await request(sw, '/assets/index-xyz.css');
    await request(sw, '/assets/index-xyz.css');

    expect(sw.network.calls.filter((url) => url.endsWith('/assets/index-xyz.css'))).toHaveLength(1);
  });

  test('une nouvelle version efface les copies des anciennes', async () => {
    await (await sw.caches.open('lecture-v0')).put('/api/bible', new Response('ancien'));

    await lifecycle(sw, 'activate');

    expect([...sw.caches.stores.keys()]).not.toContain('lecture-v0');
  });
});
