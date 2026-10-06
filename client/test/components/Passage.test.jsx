// @vitest-environment jsdom
// Tests d'un passage : affichage des versets, des notes, menu à l'appui long, bouton Partager.
// La ligne du dessus fait tourner ce fichier dans un faux navigateur (jsdom).

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Passage from '../../src/components/Passage.jsx';
import { LONG_PRESS_DELAY } from '../../src/hooks/longPress.js';

const passage = {
  slug: 'creation',
  title: 'La Création',
  book: { code: 'Gn', title: 'La Genèse' },
  start: { chapter: '1', verse: '1' },
  end: { chapter: '1', verse: '2' },
  characters: [{ slug: 'adam', name: 'Adam' }, { slug: 'eve', name: 'Ève' }],
  verses: [
    { chapter: '1', verse: '1', kind: 'verse', text: 'Au commencement, Dieu créa le ciel et la terre.', sectionTitle: 'La lumière' },
    { chapter: '1', verse: null, kind: 'unnumbered', text: 'ELLE', sectionTitle: null },
    { chapter: '1', verse: '2', kind: 'verse', text: 'La terre était informe et vide.', sectionTitle: null },
  ],
};

// Ce que reçoit le menu quand on l'ouvre sur le premier verset : sa référence et son texte
const FIRST_VERSE = {
  key: 'Gn 1,1', text: 'Au commencement, Dieu créa le ciel et la terre.', reference: { book: 'Gn', chapter: '1', verse: '1' },
};

function renderPassage({
  highlights = new Map(),
  notes = new Map(),
  // Faux partage : par défaut, le lien a été copié
  onShare = vi.fn().mockResolvedValue('copied'),
} = {}) {
  const openMenu = vi.fn();
  render(
    <MemoryRouter>
      <Passage passage={passage} annotations={{ highlights, notes, openMenu }} onShare={onShare} />
    </MemoryRouter>,
  );
  return { openMenu, onShare };
}

// Le verset "Gn 1,1", trouvé par son texte comme le ferait un utilisateur
function firstVerse() {
  return screen.getByRole('button', { name: /Au commencement/ });
}

describe('Passage', () => {
  // Faux minuteurs : on fait avancer le temps nous-mêmes, sans attendre vraiment 500 ms
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  test('affiche le titre et la référence', () => {
    renderPassage();

    expect(screen.getByRole('heading', { name: 'La Création' })).toBeDefined();
    expect(screen.getByText('La Genèse 1, 1-2')).toBeDefined();
  });

  test('un appui long sur un verset ouvre son menu', () => {
    const { openMenu } = renderPassage();

    fireEvent.pointerDown(firstVerse(), { button: 0, clientX: 50, clientY: 50 });
    vi.advanceTimersByTime(LONG_PRESS_DELAY);

    expect(openMenu).toHaveBeenCalledWith(FIRST_VERSE);
  });

  test('un toucher bref n\'ouvre pas le menu', () => {
    const { openMenu } = renderPassage();

    fireEvent.pointerDown(firstVerse(), { button: 0, clientX: 50, clientY: 50 });
    vi.advanceTimersByTime(LONG_PRESS_DELAY / 2);
    fireEvent.pointerUp(firstVerse());
    vi.advanceTimersByTime(LONG_PRESS_DELAY);

    expect(openMenu).not.toHaveBeenCalled();
  });

  test('un doigt qui glisse (l\'utilisateur scrolle) n\'ouvre pas le menu', () => {
    const { openMenu } = renderPassage();

    fireEvent.pointerDown(firstVerse(), { button: 0, clientX: 50, clientY: 50 });
    fireEvent.pointerMove(firstVerse(), { clientX: 50, clientY: 120 });
    vi.advanceTimersByTime(LONG_PRESS_DELAY);

    expect(openMenu).not.toHaveBeenCalled();
  });

  test('un clic droit ouvre le menu', () => {
    const { openMenu } = renderPassage();

    fireEvent.contextMenu(firstVerse());

    expect(openMenu).toHaveBeenCalledWith(FIRST_VERSE);
  });

  test('au clavier, Entrée ouvre le menu', () => {
    const { openMenu } = renderPassage();

    fireEvent.keyDown(firstVerse(), { key: 'Enter' });

    expect(openMenu).toHaveBeenCalledWith(FIRST_VERSE);
  });

  test('une ligne sans numéro n\'a pas de menu', () => {
    renderPassage();

    expect(screen.queryByRole('button', { name: 'ELLE' })).toBeNull();
  });

  test('la note d\'un verset s\'affiche sous celui-ci', () => {
    const notes = new Map([['Gn 1,2', { text: 'Avant la création : le chaos', updatedAt: '' }]]);

    renderPassage({ notes });

    expect(screen.getByText('Avant la création : le chaos')).toBeDefined();
  });
});

describe('Passage : bouton Partager', () => {
  afterEach(cleanup);

  test('partage le passage', async () => {
    const { onShare } = renderPassage();

    fireEvent.click(screen.getByRole('button', { name: 'Partager' }));

    expect(onShare).toHaveBeenCalledWith(passage);
    expect(await screen.findByRole('button', { name: 'Lien copié ✓' })).toBeDefined();
  });

  test('après la feuille de partage du téléphone, le bouton reste "Partager"', async () => {
    const onShare = vi.fn().mockResolvedValue('shared');
    renderPassage({ onShare });

    fireEvent.click(screen.getByRole('button', { name: 'Partager' }));

    await vi.waitFor(() => expect(onShare).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Partager' })).toBeDefined();
  });

  test('si le partage échoue, le dit', async () => {
    renderPassage({ onShare: vi.fn().mockRejectedValue(new Error('refusé')) });

    fireEvent.click(screen.getByRole('button', { name: 'Partager' }));

    expect(await screen.findByRole('button', { name: 'Partage impossible' })).toBeDefined();
  });
});

describe('Passage : lire tout le chapitre', () => {
  afterEach(cleanup);

  test('un lien ouvre la Bible entière au chapitre où commence l\'épisode', () => {
    renderPassage();

    const link = screen.getByRole('link', { name: 'Lire tout le chapitre' });

    expect(link.getAttribute('href')).toBe('/bible?livre=Gn&chapitre=1');
  });

  test('un sous-chapitre : son intertitre, juste avant le verset où il commence', () => {
    renderPassage();

    const title = screen.getByRole('heading', { name: 'La lumière' });
    const firstVerse = screen.getByText('Au commencement, Dieu créa le ciel et la terre.');
    expect(title.compareDocumentPosition(firstVerse) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole('heading')).toHaveLength(2);
  });

  test('les personnages de l\'épisode, sous sa référence', () => {
    renderPassage();

    expect(screen.getByText('Personnages : Adam, Ève')).toBeDefined();
  });
});
