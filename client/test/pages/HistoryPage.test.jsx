// @vitest-environment jsdom
// Tests de la page « Histoire du salut » : où commence la timeline (début, lien partagé), et le retour au début.
// L'API est remplacée par un faux fetch ; l'IntersectionObserver par un faux qui « voit » tout de suite le bas de page.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import NavBar from '../../src/components/NavBar.jsx';
import HistoryPage from '../../src/pages/HistoryPage.jsx';

const passage = (position, slug, title) => ({
  id: position, position, slug, title, book: { code: 'Gn', title: 'La Genèse' },
  start: { chapter: '1', verse: '1' }, end: { chapter: '1', verse: '1' },
  verses: [{ chapter: '1', verse: '1', kind: 'verse', text: `Texte de ${title}` }],
});

// La timeline : la Création (1), puis la chute (2)
const pages = {
  0: { passages: [passage(1, 'creation', 'La Création'), passage(2, 'chute', 'La chute')], nextCursor: null },
  1: { passages: [passage(2, 'chute', 'La chute')], nextCursor: null },
};

function renderAt(address) {
  render(
    <MemoryRouter initialEntries={[address]}>
      <NavBar pages={[{ to: '/', label: 'Histoire du salut' }]} />
      <HistoryPage annotations={{ highlights: new Map(), notes: new Map(), openMenu: vi.fn() }} />
    </MemoryRouter>,
  );
}

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/api/passages/chute') return new Response(JSON.stringify(passage(2, 'chute', 'La chute')));
      if (url.startsWith('/api/overview/')) return new Response('[]');
      const after = Number(new URL(url, 'http://test').searchParams.get('after'));
      return new Response(JSON.stringify(pages[after]));
    }));
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback) { this.callback = callback; }
      observe() { setTimeout(() => this.callback([{ isIntersecting: true }]), 0); }
      disconnect() {}
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test('ouverte depuis un lien partagé (?passage=chute) : commence à ce passage', async () => {
    renderAt('/?passage=chute');

    expect(await screen.findByRole('heading', { name: 'La chute' })).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'La Création' })).toBeNull();
  });

  test('le lien « Histoire du salut » de la barre ramène au début (sans recharger la page)', async () => {
    renderAt('/?passage=chute');
    await screen.findByRole('heading', { name: 'La chute' });

    fireEvent.click(screen.getByRole('link', { name: 'Histoire du salut' }));

    expect(await screen.findByRole('heading', { name: 'La Création' })).toBeDefined();
  });

  test('« Revenir au début de l\'histoire » ramène à la Création (sans recharger la page)', async () => {
    renderAt('/?passage=chute');

    fireEvent.click(await screen.findByRole('link', { name: /Revenir au début de l'histoire/ }));

    expect(await screen.findByRole('heading', { name: 'La Création' })).toBeDefined();
  });
});
