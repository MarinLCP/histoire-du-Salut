// @vitest-environment jsdom
// Tests de la pastille du titre en bas de la lecture : cachée tant que le vrai titre est à l'écran ; un toucher
// la déplie (le titre en entier), un autre la replie ; un nouveau titre arrive replié.

import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ReadingTitle from '../../src/frise/ReadingTitle.jsx';

const LONG_TITLE = 'Livre des Psaumes · Chapitre 78 · Les leçons de l\'histoire';

// Deux chapitres dans la page, leur haut déjà passé au-dessus de l'écran (leur vrai titre n'est plus visible)
function chaptersReadPast() {
  const chapters = [[78, LONG_TITLE], [79, 'Livre des Psaumes · Chapitre 79']].map(([position, title]) => {
    const chapter = document.createElement('article');
    chapter.dataset.readingPosition = position;
    chapter.dataset.readingTitle = title;
    chapter.getBoundingClientRect = () => ({ top: -300, height: 2000 });
    return chapter;
  });
  document.body.append(...chapters);
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('ReadingTitle', () => {
  test('le vrai titre est à l\'écran : la pastille est cachée, ni clavier ni lecteur d\'écran', () => {
    render(<ReadingTitle readingAt={null} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  test('un toucher déplie le titre en entier, un autre le replie', () => {
    chaptersReadPast();
    render(<ReadingTitle readingAt={78.5} />);
    const title = screen.getByRole('button', { name: LONG_TITLE });

    fireEvent.click(title);
    expect(title.getAttribute('aria-expanded')).toBe('true');
    expect(title.classList.contains('unfolded')).toBe(true);

    fireEvent.click(title);
    expect(title.getAttribute('aria-expanded')).toBe('false');
  });

  test('la lecture passe au chapitre suivant : son titre arrive replié', () => {
    chaptersReadPast();
    const { rerender } = render(<ReadingTitle readingAt={78.5} />);
    fireEvent.click(screen.getByRole('button'));

    rerender(<ReadingTitle readingAt={79.2} />);

    expect(screen.getByRole('button', { name: 'Livre des Psaumes · Chapitre 79' }).getAttribute('aria-expanded')).toBe('false');
  });
});
