// @vitest-environment jsdom
// Tests du panneau des parallèles : les plus votés d'abord, « Voir plus », le lien vers le verset, la source.
// L'API est remplacée par un faux fetch.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ParallelsPanel from '../../src/parallels/ParallelsPanel.jsx';

const at = (book, chapter, verse) => ({ book, chapter, verse });
const parallel = (position, start, end, texts, isTruncated = false) => ({
  position, votes: 30 - position, start, end, isTruncated,
  verses: texts.map((text, index) => ({ chapter: start.chapter, verse: String(Number(start.verse) + index), kind: 'verse', text })),
});

// Mt 11,14 : deux pages ; Gn 1,1 : aucun parallèle
const pages = {
  '/api/books/Mt/chapters/11/verses/14/parallels?after=0': {
    parallels: [
      parallel(1, at('Ml', '3', '23'), at('Ml', '3', '23'), ['Voici que je vais vous envoyer Élie le prophète']),
      parallel(2, at('Mc', '9', '11'), at('Mc', '9', '13'), ['Ils l\'interrogeaient', 'Élie vient d\'abord', 'Élie est déjà venu']),
    ],
    nextCursor: 2,
  },
  '/api/books/Mt/chapters/11/verses/14/parallels?after=2': {
    parallels: [parallel(3, at('Lc', '1', '17'), at('Lc', '1', '17'), ['avec l\'esprit et la puissance d\'Élie'], true)],
    nextCursor: null,
  },
  '/api/books/Gn/chapters/1/verses/1/parallels?after=0': { parallels: [], nextCursor: null },
};

// Le verset du menu : sa référence en texte et en morceaux
const MT_11_14 = { key: 'Mt 11,14', reference: { book: 'Mt', chapter: '11', verse: '14' } };
const GN_1_1 = { key: 'Gn 1,1', reference: { book: 'Gn', chapter: '1', verse: '1' } };

function renderPanel(verse = MT_11_14, { isDocked = false } = {}) {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <ParallelsPanel verse={verse} isDocked={isDocked} onClose={onClose} />
    </MemoryRouter>,
  );
  return { onClose };
}

describe('ParallelsPanel', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
    vi.stubGlobal('fetch', vi.fn(async (url) => new Response(JSON.stringify(pages[url]))));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test('les parallèles du verset, dans l\'ordre reçu : leur référence et leur texte', async () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: 'Parallèles de Mt 11,14' })).toBeDefined();
    const links = await screen.findAllByRole('link', { name: /Élie/ });
    expect(links.map((link) => link.querySelector('.parallel-reference').textContent)).toEqual(['Ml 3,23', 'Mc 9,11-13']);
    expect(links[1].textContent).toContain('Élie vient d\'abord Élie est déjà venu');
  });

  test('un clic mène au verset dans la Bible entière et referme le panneau', async () => {
    const { onClose } = renderPanel();
    const [first] = await screen.findAllByRole('link', { name: /Élie/ });

    expect(first.getAttribute('href')).toBe('/bible?livre=Ml&chapitre=3&verset=23');
    fireEvent.click(first);
    expect(onClose).toHaveBeenCalled();
  });

  test('« Voir plus » ajoute la suite, puis disparaît une fois tout chargé ; « … » si la plage est coupée', async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole('button', { name: 'Voir plus' }));

    const third = await screen.findByRole('link', { name: /Lc 1,17/ });
    expect(third.textContent).toContain('puissance d\'Élie …');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Voir plus' })).toBeNull();
  });

  test('un verset sans parallèle : un message, pas de « Voir plus »', async () => {
    renderPanel(GN_1_1);

    expect(await screen.findByText('Aucun parallèle pour ce verset.')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Voir plus' })).toBeNull();
  });

  test('API injoignable : un message et « Réessayer », qui redemande la page', async () => {
    let isDown = true;
    vi.stubGlobal('fetch', vi.fn(async (url) => (isDown
      ? new Response(JSON.stringify({ error: 'Base indisponible.' }), { status: 503 })
      : new Response(JSON.stringify(pages[url])))));
    renderPanel();

    expect(await screen.findByText('Base indisponible.')).toBeDefined();
    isDown = false;
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByRole('link', { name: /Ml 3,23/ })).toBeDefined();
  });

  test('cite la source des parallèles (licence CC-BY)', () => {
    renderPanel();

    expect(screen.getByRole('link', { name: 'OpenBible.info' }).getAttribute('href')).toContain('openbible.info');
    expect(screen.getByText(/CC-BY/)).toBeDefined();
  });

  describe('fixé à droite (écran large)', () => {
    test('un panneau à côté de la lecture, pas une fenêtre par-dessus', async () => {
      renderPanel(MT_11_14, { isDocked: true });

      expect(screen.getByRole('complementary', { name: 'Parallèles de Mt 11,14' })).toBeDefined();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    test('un clic sur un parallèle le laisse ouvert (on lit à côté)', async () => {
      const { onClose } = renderPanel(MT_11_14, { isDocked: true });

      fireEvent.click((await screen.findAllByRole('link', { name: /Élie/ }))[0]);

      expect(onClose).not.toHaveBeenCalled();
    });

    test('« Fermer » ou Échap le referment', () => {
      const { onClose } = renderPanel(MT_11_14, { isDocked: true });

      fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });
});
