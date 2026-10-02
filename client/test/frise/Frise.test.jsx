// @vitest-environment jsdom
// Tests du composant Frise : il charge la vue d'ensemble et dessine l'escalier.
// jsdom ne calcule aucune taille : un faux ResizeObserver annonce une zone de 400 × 600 px.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Frise from '../../src/frise/Frise.jsx';

const node = (title, icon, children = [], detail = null) => ({ title, detail, icon, position: 1, children });
const chapter = (label) => node('La Genèse', 'page', [], `chapitre ${label} · en entier`);
const overview = [
  node('Les origines', 'sun', [node('La Création', 'sun', [chapter('1'), chapter('2')]), node('La chute', 'tree', [chapter('3')])]),
  node('Les patriarches', 'tent', [node("L'appel d'Abraham", 'tent', [chapter('12')])]),
];
const TAB_NAMES = ["Vue d'ensemble", 'Épisodes', 'Chapitres'];

function renderFrise() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(overview))));
  return render(<Frise mode="history" tabNames={TAB_NAMES} />);
}

const pressedTab = () => screen.getAllByRole('button', { pressed: true }).map((button) => button.textContent);

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
    const { container } = renderFrise();

    expect(await screen.findByRole('button', { name: 'Les origines' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Les patriarches' })).toBeDefined();
    expect(screen.queryByText('La Création')).toBeNull();
    expect(container.querySelectorAll('.frise-block[aria-hidden="true"]')).toHaveLength(3);
  });

  test('demande la vue d\'ensemble du mode choisi', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(overview)));
    vi.stubGlobal('fetch', fetch);
    render(<Frise mode="history" tabNames={TAB_NAMES} />);

    await screen.findByText('Les origines');
    expect(fetch).toHaveBeenCalledWith('/api/overview/history');
  });

  test('si le chargement échoue, la frise reste vide (la lecture marche sans elle)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('réseau coupé')));
    render(<Frise mode="history" tabNames={TAB_NAMES} />);

    expect(screen.getByRole('navigation', { name: 'Frise' })).toBeDefined();
    await Promise.resolve();
    expect(screen.queryByText('Les origines')).toBeNull();
  });

  test('clic sur une époque : ses épisodes forment l\'escalier, l\'époque devient une bande (clic = remonter)', async () => {
    renderFrise();

    fireEvent.click(await screen.findByRole('button', { name: 'Les origines' }));

    expect(screen.getByRole('button', { name: 'La Création' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Les patriarches' })).toBeNull();
    expect(pressedTab()).toEqual(['Épisodes']);

    fireEvent.click(screen.getByRole('button', { name: 'Les origines' }));

    expect(screen.getByRole('button', { name: 'Les patriarches' })).toBeDefined();
    expect(pressedTab()).toEqual(["Vue d'ensemble"]);
  });

  test('au niveau le plus fin, les chapitres disent quelle partie l\'épisode en couvre', async () => {
    renderFrise();

    fireEvent.click(await screen.findByRole('button', { name: 'Chapitres' }));

    expect(screen.getByText('chapitre 1 · en entier')).toBeDefined();
    expect(pressedTab()).toEqual(['Chapitres']);
  });
});
