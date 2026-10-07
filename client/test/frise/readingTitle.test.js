// @vitest-environment jsdom
// Tests du titre collé en haut de la lecture : le titre de l'élément lu (data-reading-title), seulement une
// fois son vrai titre passé au-dessus de l'écran.

import { describe, test, expect } from 'vitest';
import { readingTitleAt } from '../../src/frise/readingPosition.js';

describe('readingTitleAt', () => {
  // Un chapitre dans la page, dont le haut est à `top` pixels du haut de l'écran
  function chapterAt(top) {
    document.body.innerHTML = '<article data-reading-position="78" data-reading-title="Livre des Psaumes · Chapitre 78"></article>';
    document.querySelector('article').getBoundingClientRect = () => ({ top, height: 2000 });
  }

  test('le titre de l\'élément lu, une fois son haut passé sous la navigation', () => {
    chapterAt(-300);

    expect(readingTitleAt(78.4)).toBe('Livre des Psaumes · Chapitre 78');
  });

  test('rien tant que le haut de l\'élément (et son vrai titre) est encore à l\'écran', () => {
    chapterAt(120);

    expect(readingTitleAt(78.01)).toBeNull();
  });

  test('rien à lire : rien', () => {
    document.body.innerHTML = '';

    expect(readingTitleAt(null)).toBeNull();
    expect(readingTitleAt(3.2)).toBeNull();
  });
});
