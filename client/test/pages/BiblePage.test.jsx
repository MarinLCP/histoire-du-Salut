// @vitest-environment jsdom
// Tests de la page « Bible entière » : la lecture en continu, chapitre après chapitre.
// L'API est remplacée par un faux fetch ; l'IntersectionObserver par un faux qui « voit » tout de suite le bas de page.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import BiblePage from '../../src/pages/BiblePage.jsx';

const chapter = (position, code, title, label, text) => ({
  position, book: { code, title }, chapter: label,
  verses: [{ chapter: label, verse: '1', kind: 'verse', text }],
});

// Deux pages : Genèse 1 et 2, puis Exode 1 (la fin)
const pages = {
  0: { chapters: [chapter(1, 'Gn', 'La Genèse', '1', 'AU COMMENCEMENT'), chapter(2, 'Gn', 'La Genèse', '2', 'Ainsi furent achevés')], nextCursor: 2 },
  2: { chapters: [chapter(3, 'Ex', "L'Exode", '1', 'Voici les noms')], nextCursor: null },
};

function renderPage(address = '/bible') {
  const openMenu = vi.fn();
  render(
    <MemoryRouter initialEntries={[address]}>
      <BiblePage annotations={{ highlights: new Map(), notes: new Map(), openMenu }} />
    </MemoryRouter>,
  );
  return { openMenu };
}

describe('BiblePage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      // Position d'un chapitre (lien "Lire tout le chapitre") : Exode 1 = 3e chapitre ; le reste n'existe pas
      if (url.startsWith('/api/books/')) {
        return url === '/api/books/Ex/chapters/1'
          ? new Response(JSON.stringify({ position: 3 }))
          : new Response(JSON.stringify({ error: 'introuvable' }), { status: 404 });
      }
      const after = Number(new URL(url, 'http://test').searchParams.get('after'));
      return new Response(JSON.stringify(pages[after]));
    }));
    // Le bas de page est toujours « visible » : chaque page chargée déclenche la suivante, jusqu'à la fin
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

  test('lit la Bible en continu : les chapitres, puis le livre suivant, puis la fin', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'La Genèse' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Chapitre 1' })).toBeDefined();
    expect(await screen.findByRole('heading', { name: "L'Exode" })).toBeDefined();
    expect(await screen.findByText('Tu as lu toute la Bible.')).toBeDefined();
  });

  test('le titre du livre n\'apparaît qu\'une fois, au premier chapitre du livre', async () => {
    renderPage();

    await screen.findByText('Tu as lu toute la Bible.');
    expect(screen.getAllByRole('heading', { name: 'La Genèse' })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { name: /^Chapitre/ })).toHaveLength(3);
  });

  test('un verset de la Bible a le même menu que dans l\'histoire du salut (même référence)', async () => {
    const { openMenu } = renderPage();

    fireEvent.contextMenu(await screen.findByRole('button', { name: /AU COMMENCEMENT/ }));

    expect(openMenu).toHaveBeenCalledWith({ key: 'Gn 1,1', text: 'AU COMMENCEMENT' });
  });

  test('ouverte depuis un lien (?livre=Ex&chapitre=1) : commence à ce chapitre, avec un retour au début', async () => {
    renderPage('/bible?livre=Ex&chapitre=1');

    expect(await screen.findByRole('heading', { name: "L'Exode" })).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'La Genèse' })).toBeNull();
    expect(screen.getByRole('link', { name: /Revenir au début de la Bible/ })).toBeDefined();
  });

  test('« Revenir au début » recommence vraiment à la Genèse (pas au chapitre du lien)', async () => {
    renderPage('/bible?livre=Ex&chapitre=1');

    fireEvent.click(await screen.findByRole('link', { name: /Revenir au début de la Bible/ }));

    expect(await screen.findByRole('heading', { name: 'La Genèse' })).toBeDefined();
    expect(screen.queryByRole('link', { name: /Revenir au début de la Bible/ })).toBeNull();
  });

  test('un lien vers un chapitre inconnu ouvre la Bible depuis le début', async () => {
    renderPage('/bible?livre=Xx&chapitre=1');

    expect(await screen.findByRole('heading', { name: 'La Genèse' })).toBeDefined();
  });
});
