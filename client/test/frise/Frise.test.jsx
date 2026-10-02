// @vitest-environment jsdom
// Tests du composant Frise : il charge la vue d'ensemble et dessine l'escalier.
// jsdom ne calcule aucune taille : un faux ResizeObserver annonce une zone de 400 × 600 px.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Frise from '../../src/frise/Frise.jsx';

const node = (title, icon, children = []) => ({ title, detail: null, icon, position: 1, children });
const overview = [
  node('Les origines', 'sun', [node('La Création', 'sun'), node('La chute', 'tree')]),
  node('Les patriarches', 'tent', [node("L'appel d'Abraham", 'tent')]),
];

describe('Frise', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback) { this.callback = callback; }
      observe() { this.callback([{ contentRect: { width: 400, height: 600 } }]); }
      disconnect() {}
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test('un bloc avec son titre par époque ; les épisodes sont de petites marches sans titre', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(overview))));
    const { container } = render(<Frise mode="history" />);

    expect(await screen.findByText('Les origines')).toBeDefined();
    expect(screen.getByText('Les patriarches')).toBeDefined();
    expect(screen.queryByText('La Création')).toBeNull();
    expect(container.querySelectorAll('.frise-block[aria-hidden="true"]')).toHaveLength(3);
  });

  test('demande la vue d\'ensemble du mode choisi', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(overview)));
    vi.stubGlobal('fetch', fetch);
    render(<Frise mode="history" />);

    await screen.findByText('Les origines');
    expect(fetch).toHaveBeenCalledWith('/api/overview/history');
  });

  test('si le chargement échoue, la frise reste vide (la lecture marche sans elle)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('réseau coupé')));
    render(<Frise mode="history" />);

    expect(screen.getByRole('navigation', { name: 'Frise' })).toBeDefined();
    await Promise.resolve();
    expect(screen.queryByText('Les origines')).toBeNull();
  });
});
