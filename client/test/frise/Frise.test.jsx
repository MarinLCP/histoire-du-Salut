// @vitest-environment jsdom
// Tests du composant Frise : il charge la vue d'ensemble et dessine l'escalier.
// jsdom ne calcule aucune taille : un faux ResizeObserver annonce une zone de 400 × 600 px.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Frise from '../../src/frise/Frise.jsx';
import { stubResizeObserver } from '../helpers/stubResizeObserver.js';

const node = (title, icon, position, children = [], detail = null) => ({ title, detail, icon, position, children });
const chapter = (label, position) => node('La Genèse', 'page', position, [], `chapitre ${label} · en entier`);
// 3 épisodes (positions 1, 2, 3) dans 2 époques
const overview = [
  node('Les origines', 'sun', 1, [
    node('La Création', 'sun', 1, [chapter('1', 1), chapter('2', 1)]),
    node('La chute', 'tree', 2, [chapter('3', 2)]),
  ]),
  node('Les patriarches', 'tent', 3, [node("L'appel d'Abraham", 'tent', 3, [chapter('12', 3)])]),
];
const TAB_NAMES = ["Vue d'ensemble", 'Épisodes', 'Chapitres'];

function renderFrise(onJump = vi.fn()) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(overview))));
  return render(<Frise mode="history" tabNames={TAB_NAMES} onJump={onJump} />);
}

const pressedTab = () => screen.getAllByRole('button', { pressed: true }).map((button) => button.textContent);

describe('Frise', () => {
  beforeEach(() => {
    stubResizeObserver(400, 600);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.body.querySelectorAll('[data-reading-position]').forEach((element) => element.remove());
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
    render(<Frise mode="history" tabNames={TAB_NAMES} onJump={vi.fn()} />);

    await screen.findByText('Les origines');
    expect(fetch).toHaveBeenCalledWith('/api/overview/history');
  });

  test('tant que la vue d\'ensemble n\'est pas chargée, pas d\'onglets : rien à zoomer (sinon un clic plantait la page)', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<Frise mode="history" tabNames={TAB_NAMES} onJump={vi.fn()} />);

    expect(screen.getByRole('navigation', { name: 'Frise' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Épisodes' })).toBeNull();
  });

  test('si le chargement échoue, la frise reste vide (la lecture marche sans elle)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('réseau coupé')));
    render(<Frise mode="history" tabNames={TAB_NAMES} onJump={vi.fn()} />);

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

  test('clic sur un bloc : la lecture saute à sa position (une bande, elle, ne fait que remonter)', async () => {
    const onJump = vi.fn();
    renderFrise(onJump);

    fireEvent.click(await screen.findByRole('button', { name: 'Les patriarches' }));
    expect(onJump).toHaveBeenLastCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: 'Les patriarches' }));
    expect(onJump).toHaveBeenCalledTimes(1);
  });

  test('le bloc de ce qu\'on lit est marqué (surligné) dans la frise', async () => {
    // Un passage n° 1 dans la page : c'est lui qu'on lit
    const article = document.createElement('article');
    article.dataset.readingPosition = '1';
    document.body.append(article);
    renderFrise();

    expect(await screen.findByRole('button', { name: 'Les origines', current: 'location' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Les patriarches' }).getAttribute('aria-current')).toBeNull();
  });

  test('marque-page : un ruban sur le bloc où on s\'était arrêté ; un clic y ramène, puis il disparaît', async () => {
    localStorage.setItem('bookmarks', JSON.stringify({ version: 1, bookmarks: { history: 3.4 } }));
    const onJump = vi.fn();
    renderFrise(onJump);

    const ribbon = await screen.findByRole('button', { name: /Reprendre la lecture/ });
    expect(ribbon.getAttribute('aria-label')).toContain('Les patriarches');

    fireEvent.click(ribbon);

    expect(onJump).toHaveBeenCalledWith(3.4);
    expect(screen.queryByRole('button', { name: /Reprendre la lecture/ })).toBeNull();
  });
});
