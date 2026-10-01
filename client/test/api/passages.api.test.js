// Tests des appels à l'API : ce que reçoit l'app quand tout va bien, et les messages d'erreur
// qu'elle affiche sinon. fetch est remplacé par un faux qui renvoie la réponse voulue.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { fetchPassage, fetchTimeline } from '../../src/api/passages.api.js';

// Une réponse HTTP comme celle que renverrait le serveur
const jsonResponse = (status, body) => new Response(JSON.stringify(body), { status });

afterEach(() => vi.unstubAllGlobals());

describe('appels à l\'API', () => {
  test('renvoie les données quand le serveur répond', async () => {
    const page = { passages: [], nextCursor: null };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, page)));

    await expect(fetchTimeline(0)).resolves.toEqual(page);
  });

  test('demande la suite de la timeline après la position donnée', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { passages: [], nextCursor: null }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTimeline(5);

    expect(fetchMock).toHaveBeenCalledWith('/api/timeline?after=5');
  });

  test('un slug est encodé dans l\'adresse (pas de caractère qui casse l\'URL)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    await fetchPassage('a/b?c');

    expect(fetchMock).toHaveBeenCalledWith('/api/passages/a%2Fb%3Fc');
  });
});

describe('messages d\'erreur', () => {
  test('serveur injoignable (réseau coupé, API arrêtée)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(fetchTimeline(0)).rejects.toThrow('Impossible de joindre le serveur. Vérifie ta connexion.');
  });

  test('le serveur explique l\'erreur : on reprend son message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, { error: 'Passage "x" introuvable.' })));

    await expect(fetchPassage('x')).rejects.toThrow('Passage "x" introuvable.');
  });

  test('erreur sans explication (ex. une 500 en HTML) : message générique avec le code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<h1>Internal Server Error</h1>', { status: 500 })));

    await expect(fetchTimeline(0)).rejects.toThrow('Le chargement a échoué (erreur 500).');
  });
});
