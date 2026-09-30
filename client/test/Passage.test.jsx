// @vitest-environment jsdom
// Tests d'un passage : affichage des versets, des notes, et ouverture du menu à l'appui long.
// La ligne du dessus fait tourner ce fichier dans un faux navigateur (jsdom).

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Passage from '../src/components/Passage.jsx';
import { LONG_PRESS_DELAY } from '../src/hooks/longPress.js';

const passage = {
  id: 1,
  title: 'La Création',
  book: { code: 'Gn', title: 'La Genèse' },
  start: { chapter: '1', verse: '1' },
  end: { chapter: '1', verse: '2' },
  verses: [
    { chapter: '1', verse: '1', kind: 'verse', text: 'Au commencement, Dieu créa le ciel et la terre.' },
    { chapter: '1', verse: null, kind: 'unnumbered', text: 'ELLE' },
    { chapter: '1', verse: '2', kind: 'verse', text: 'La terre était informe et vide.' },
  ],
};

// Ce que reçoit le menu quand on l'ouvre sur le premier verset : sa référence et son texte
const FIRST_VERSE = { key: 'Gn 1,1', text: 'Au commencement, Dieu créa le ciel et la terre.' };

function renderPassage({ highlights = new Map(), notes = new Map() } = {}) {
  const openMenu = vi.fn();
  render(<Passage passage={passage} annotations={{ highlights, notes, openMenu }} />);
  return { openMenu };
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
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('la note d\'un verset s\'affiche sous celui-ci', () => {
    const notes = new Map([['Gn 1,2', { text: 'Avant la création : le chaos', updatedAt: '' }]]);

    renderPassage({ notes });

    expect(screen.getByText('Avant la création : le chaos')).toBeDefined();
  });
});
