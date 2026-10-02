// Tests de l'appel « vue d'ensemble » de la frise : l'arbre ne change pas pendant une visite,
// il n'est donc téléchargé qu'une fois par mode (et retenté si le chargement a échoué).

import { describe, test, expect, vi, afterEach } from 'vitest';
import { fetchOverview } from '../../src/api/overview.api.js';

const jsonResponse = (body) => new Response(JSON.stringify(body));

// Le cache est vidé après chaque test par test/setup.js
afterEach(() => vi.unstubAllGlobals());

describe('fetchOverview', () => {
  test('un seul téléchargement par mode, même demandé plusieurs fois (aller-retour entre les pages)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse([{ title: 'Les origines' }]));
    vi.stubGlobal('fetch', fetchMock);

    await fetchOverview('bible');
    await fetchOverview('bible');
    await fetchOverview('history');

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/overview/bible', '/api/overview/history']);
  });

  test('un échec n\'est pas retenu : le prochain appel réessaie', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('réseau coupé'))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOverview('history')).rejects.toThrow();
    await expect(fetchOverview('history')).resolves.toEqual([]);
  });
});
