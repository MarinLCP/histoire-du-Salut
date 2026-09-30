// Tests de la règle qui distingue un appui long d'un scroll.

import { describe, test, expect } from 'vitest';
import { hasMovedTooFar } from '../src/hooks/longPress.js';

describe('hasMovedTooFar', () => {
  const start = { x: 100, y: 200 };

  test('un doigt immobile n\'a pas bougé', () => {
    expect(hasMovedTooFar(start, { x: 100, y: 200 })).toBe(false);
  });

  test('un léger tremblement du doigt est toléré', () => {
    expect(hasMovedTooFar(start, { x: 104, y: 205 })).toBe(false);
  });

  test('un doigt qui glisse (l\'utilisateur scrolle) a bougé', () => {
    expect(hasMovedTooFar(start, { x: 100, y: 240 })).toBe(true);
  });

  test('le mouvement compte dans toutes les directions', () => {
    expect(hasMovedTooFar(start, { x: 60, y: 200 })).toBe(true);
  });
});
