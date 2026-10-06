// @vitest-environment jsdom
// Tests de « Partager où j'en suis » : choisir un pseudo, partager le lien (copié s'il n'y a pas de feuille
// de partage), arrêter de partager. Faux fetch ; presse-papiers remplacé.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SharingSection from '../../src/account/SharingSection.jsx';

const json = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status });

// Faux serveur : sharing = ce que renvoie GET /api/me/sharing
function fakeServer(sharing) {
  const fetchMock = vi.fn(async (url, options) => {
    if (options?.method === 'POST') return json({ token: 'jeton-123' });
    // Le serveur renvoie le pseudo tel qu'il l'a rangé
    if (options?.method === 'PUT') return json({ displayName: JSON.parse(options.body).displayName.trim() });
    if (options?.method) return json(null, 204);
    return json(sharing);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('SharingSection', () => {
  beforeEach(() => {
    // Pas de feuille de partage (comme sur ordinateur) : le lien est copié
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    // Le presse-papiers moderne n'existe qu'en HTTPS (ou sur localhost)
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test('sans pseudo : il faut en choisir un avant de partager', async () => {
    const fetchMock = fakeServer({ displayName: null, token: null });
    render(<SharingSection />);

    await userEvent.type(await screen.findByLabelText(/Ton pseudo/), ' Marin ');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le pseudo' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/me/profile', expect.objectContaining({ body: '{"displayName":" Marin "}' }));
    expect(await screen.findByText('Marin')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Partager où j\'en suis' })).toBeDefined();
  });

  test('partager : le lien de progression est créé puis copié', async () => {
    fakeServer({ displayName: 'Marin', token: null });
    render(<SharingSection />);

    await userEvent.click(await screen.findByRole('button', { name: 'Partager où j\'en suis' }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${location.origin}/progression/jeton-123`);
    expect(await screen.findByText(/Lien copié/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Arrêter de partager' })).toBeDefined();
  });

  test('arrêter de partager', async () => {
    const fetchMock = fakeServer({ displayName: 'Marin', token: 'jeton-123' });
    render(<SharingSection />);

    await userEvent.click(await screen.findByRole('button', { name: 'Arrêter de partager' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/me/sharing', expect.objectContaining({ method: 'DELETE' }));
    expect(await screen.findByText('Le lien ne mène plus nulle part.')).toBeDefined();
  });

  test('« Arrêter de partager » qui échoue : le message d\'erreur est affiché', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, options) => (options?.method === 'DELETE'
      ? json({ error: 'Base indisponible.' }, 503)
      : json({ displayName: 'Marin', token: 'jeton-123' }))));
    render(<SharingSection />);

    await userEvent.click(await screen.findByRole('button', { name: 'Arrêter de partager' }));

    expect(await screen.findByText('Base indisponible.')).toBeDefined();
  });
});
