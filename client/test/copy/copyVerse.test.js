// Tests unitaires du texte copié quand on copie un verset.

import { describe, test, expect } from 'vitest';
import { formatVerseForCopy } from '../../src/copy/copyVerse.js';

// Les guillemets français sont séparés du texte par une espace insécable
const NO_BREAK_SPACE = '\u00a0';

describe('formatVerseForCopy', () => {
  test('met le verset entre guillemets, suivi de sa référence', () => {
    expect(formatVerseForCopy('Gn 1,3', 'Et la lumière fut.')).toBe(`«${NO_BREAK_SPACE}Et la lumière fut.${NO_BREAK_SPACE}» (Gn 1,3)`);
  });

  test('garde les retours à la ligne des vers poétiques', () => {
    const text = 'Dieu dit :\n« Que la lumière soit. »';

    expect(formatVerseForCopy('Gn 1,3', text)).toBe(`«${NO_BREAK_SPACE}${text}${NO_BREAK_SPACE}» (Gn 1,3)`);
  });
});
