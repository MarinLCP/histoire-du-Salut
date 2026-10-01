// Tests unitaires de la logique des surlignages (fonctions pures : ni React, ni navigateur).

import { describe, test, expect } from 'vitest';
import { toggleHighlight } from '../../src/highlights/highlights.js';

describe('toggleHighlight', () => {
  const now = new Date('2026-09-30T10:00:00.000Z');

  test('surligne un verset qui ne l\'était pas, avec la date', () => {
    const highlights = toggleHighlight(new Map(), 'Gn 1,3', now);

    expect(highlights.get('Gn 1,3')).toEqual({ createdAt: '2026-09-30T10:00:00.000Z' });
  });

  test('retire le surlignage d\'un verset déjà surligné', () => {
    const highlighted = toggleHighlight(new Map(), 'Gn 1,3', now);

    const highlights = toggleHighlight(highlighted, 'Gn 1,3', now);

    expect(highlights.has('Gn 1,3')).toBe(false);
  });

  test('ne touche pas aux autres versets surlignés', () => {
    const highlighted = toggleHighlight(new Map(), 'Gn 1,1', now);

    const highlights = toggleHighlight(highlighted, 'Gn 1,3', now);

    expect([...highlights.keys()]).toEqual(['Gn 1,1', 'Gn 1,3']);
  });

  test('ne modifie pas l\'ensemble reçu (renvoie un nouvel ensemble)', () => {
    const original = new Map();

    toggleHighlight(original, 'Gn 1,3', now);

    expect(original.size).toBe(0);
  });
});
