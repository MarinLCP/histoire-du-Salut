// @vitest-environment jsdom
// Tests de la page « où en est un lecteur » (/progression/<jeton>) : sa progression, et les liens pour
// lire au même endroit ; lien inconnu ; lecture pas commencée.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import ProgressPage from '../../src/pages/ProgressPage.jsx';

function renderAt(token, response) {
  vi.stubGlobal('fetch', vi.fn(async () => response));
  render(
    <MemoryRouter initialEntries={[`/progression/${token}`]}>
      <Routes>
        <Route path="/progression/:token" element={<ProgressPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ProgressPage', () => {
  test('l\'épisode et le chapitre où en est le lecteur, avec de quoi lire au même endroit', async () => {
    renderAt('abc', new Response(JSON.stringify({
      name: 'Marin',
      history: { episode: 2, total: 32, slug: 'chute', title: 'La chute' },
      bible: { book: { code: 'Gn', title: 'La Genèse' }, chapter: '3' },
    })));

    expect(await screen.findByRole('heading', { name: 'Où en est Marin' })).toBeDefined();
    expect(screen.getByText(/Épisode 2 sur 32/)).toBeDefined();
    const [historyLink, bibleLink] = screen.getAllByRole('link', { name: 'Lire au même endroit' });
    expect(historyLink.getAttribute('href')).toBe('/?passage=chute');
    expect(bibleLink.getAttribute('href')).toBe('/bible?livre=Gn&chapitre=3');
  });

  test('pas encore commencé', async () => {
    renderAt('abc', new Response(JSON.stringify({ name: 'Marin', history: null, bible: null })));

    expect(await screen.findByText('Marin n\'a pas encore commencé sa lecture.')).toBeDefined();
  });

  test('lien inconnu ou arrêté', async () => {
    renderAt('inconnu', new Response(JSON.stringify({ error: 'introuvable' }), { status: 404 }));

    expect(await screen.findByRole('heading', { name: 'Ce lien de partage n\'existe pas, ou plus.' })).toBeDefined();
  });
});
