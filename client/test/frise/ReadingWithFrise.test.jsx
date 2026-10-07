// @vitest-environment jsdom
// Tests de la mise en page frise + lecture sur un écran étroit (moins de 1100 px) :
// la frise est rangée dans un panneau glissant, ouvert par l'onglet « Frise ».

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ReadingWithFrise from '../../src/frise/ReadingWithFrise.jsx';
import { stubResizeObserver } from '../helpers/stubResizeObserver.js';

const overview = [{ title: 'Les origines', detail: null, icon: 'sun', position: 1, children: [] }];
const TAB_NAMES = ["Vue d'ensemble", 'Épisodes', 'Chapitres'];

function renderNarrow(onJump = vi.fn()) {
  // MemoryRouter : « Revenir à … », en bas de la lecture, lit l'état de la navigation
  render(
    <MemoryRouter>
      <ReadingWithFrise mode="history" tabNames={TAB_NAMES} onJump={onJump}>
        <p>Le texte à lire</p>
      </ReadingWithFrise>
    </MemoryRouter>,
  );
  return { drawerTab: screen.getByRole('button', { name: 'Frise' }) };
}

describe('ReadingWithFrise sur écran étroit', () => {
  beforeEach(() => {
    // Un écran étroit : la règle (max-width: 1099px) est vraie
    vi.stubGlobal('matchMedia', (query) => ({
      matches: query === '(max-width: 1099px)', addEventListener() {}, removeEventListener() {},
    }));
    stubResizeObserver(360, 700);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(overview))));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test('fermée, la frise est hors d\'atteinte (inert) ; l\'onglet « Frise » l\'ouvre', () => {
    const { drawerTab } = renderNarrow();
    const drawer = document.getElementById('frise-drawer');

    expect(drawerTab.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.hasAttribute('inert')).toBe(true);

    fireEvent.click(drawerTab);

    expect(drawerTab.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.hasAttribute('inert')).toBe(false);
  });

  test('Échap, ou un toucher dans la lecture, referme la frise', () => {
    const { drawerTab } = renderNarrow();

    fireEvent.click(drawerTab);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(drawerTab.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(drawerTab);
    fireEvent.click(screen.getByText('Le texte à lire'));
    expect(drawerTab.getAttribute('aria-expanded')).toBe('false');
  });

  test('un clic sur un bloc fait sauter la lecture, et la frise reste ouverte (pour continuer à zoomer)', async () => {
    const onJump = vi.fn();
    const { drawerTab } = renderNarrow(onJump);

    fireEvent.click(drawerTab);
    fireEvent.click(await screen.findByRole('button', { name: 'Les origines' }));

    expect(onJump).toHaveBeenCalledWith(1);
    expect(drawerTab.getAttribute('aria-expanded')).toBe('true');
  });
});
