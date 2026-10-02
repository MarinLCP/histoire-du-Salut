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
});
