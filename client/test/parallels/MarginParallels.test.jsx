// @vitest-environment jsdom
// Tests de la marge des parallèles dans un chapitre : arrivés avec chaque verset (verse.parallels), ce sont des
// liens vers chaque verset parallèle ; un verset sans parallèle n'a pas de marge.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Chapter from '../../src/components/Chapter.jsx';

const at = (book, chapter, verse) => ({ book, chapter, verse });
const verse = (number, text, parallels = []) => ({ chapter: '78', verse: number, kind: 'verse', text, parallels });

function renderChapter(verses) {
  render(
    <MemoryRouter>
      <Chapter chapter={{ position: 600, book: { code: 'Ps', title: 'Les Psaumes' }, chapter: '78', verses }} showBookTitle
        annotations={{ highlights: new Map(), notes: new Map(), openMenu: vi.fn() }} />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('la marge des parallèles', () => {
  test('à côté du verset, ses parallèles : des liens vers chaque verset (plage comprise)', () => {
    renderChapter([verse('9', 'Aide-nous, Dieu notre Sauveur', [
      { start: at('Jr', '14', '7'), end: at('Jr', '14', '7') },
      { start: at('Mc', '9', '11'), end: at('Mc', '9', '13') },
    ])]);

    const links = screen.getByRole('list', { name: 'Parallèles de Ps 78,9' }).querySelectorAll('a');
    expect([...links].map((link) => link.textContent)).toEqual(['Jr 14,7', 'Mc 9,11-13']);
    expect(links[0].getAttribute('href')).toBe('/bible?livre=Jr&chapitre=14&verset=7');
  });

  test('un verset sans parallèle : pas de marge', () => {
    renderChapter([verse('4', 'Nous sommes la risée des voisins')]);

    expect(screen.queryByRole('list')).toBeNull();
  });
});
