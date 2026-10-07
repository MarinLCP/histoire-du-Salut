// @vitest-environment jsdom
// Tests du routage : chaque adresse affiche sa page, et la barre de navigation mène de l'une à l'autre.
// MemoryRouter : un routeur "en mémoire", pour choisir l'adresse de départ sans vrai navigateur.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../src/App.jsx';

function renderAt(address) {
  render(
    <MemoryRouter initialEntries={[address]}>
      <App />
    </MemoryRouter>,
  );
}

describe('routage', () => {
  beforeEach(() => {
    // La timeline charge ses passages au fil du défilement : on remplace ce que jsdom n'a pas
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ passages: [], nextCursor: null }))));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test('"/" affiche l\'histoire du salut', () => {
    renderAt('/');

    expect(screen.getByRole('link', { name: 'Histoire du salut' }).getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('heading', { name: 'La Bible entière' })).toBeNull();
  });

  test('"/" affiche aussi la frise à gauche du texte', () => {
    renderAt('/');

    expect(screen.getByRole('navigation', { name: 'Frise' })).toBeDefined();
  });

  test('"/bible" affiche la Bible entière', () => {
    renderAt('/bible');

    expect(screen.getByRole('heading', { name: 'La Bible entière' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Bible entière' }).getAttribute('aria-current')).toBe('page');
  });

  test('la barre de navigation mène d\'une page à l\'autre, sans recharger', () => {
    renderAt('/');

    fireEvent.click(screen.getByRole('link', { name: 'Bible entière' }));

    expect(screen.getByRole('heading', { name: 'La Bible entière' })).toBeDefined();
  });

  test('une adresse inconnue ramène à l\'histoire du salut', () => {
    renderAt('/page-qui-n-existe-pas');

    expect(screen.getByRole('link', { name: 'Histoire du salut' }).getAttribute('aria-current')).toBe('page');
  });

  test('le bouton Paramètres ouvre le panneau ; choisir « Sombre » applique et retient le thème', () => {
    HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
    HTMLDialogElement.prototype.close = function close() { this.open = false; };
    renderAt('/');

    fireEvent.click(screen.getByRole('button', { name: 'Mon compte' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Sombre' }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(JSON.parse(localStorage.getItem('settings')).settings.theme).toBe('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  test('dans la Bible entière, « Voir les parallèles » ouvre le panneau du verset', async () => {
    HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
    const verse = { chapter: '1', verse: '1', kind: 'verse', text: 'AU COMMENCEMENT' };
    const responses = {
      '/api/bible': { chapters: [{ position: 1, book: { code: 'Gn', title: 'La Genèse' }, chapter: '1', verses: [verse] }], nextCursor: null },
      '/api/overview': [],
      '/api/books': { parallels: [], nextCursor: null },
    };
    const responseFor = (url) => Object.entries(responses).find(([start]) => url.startsWith(start))[1];
    vi.stubGlobal('fetch', vi.fn(async (url) => new Response(JSON.stringify(responseFor(url)))));
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback) { this.callback = callback; }
      observe() { setTimeout(() => this.callback([{ isIntersecting: true }]), 0); }
      disconnect() {}
    });
    renderAt('/bible');

    fireEvent.contextMenu(await screen.findByRole('button', { name: /AU COMMENCEMENT/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Voir les parallèles' }));

    expect(await screen.findByRole('heading', { name: 'Parallèles de Gn 1,1' })).toBeDefined();
  });
});
