// Tests de l'état de la frise (fonctions pures) : le niveau affiché, l'interrupteur qui relance l'animation
// de glissement à chaque changement de niveau, et la frise qui suit la lecture.

import { describe, test, expect } from 'vitest';
import { INITIAL_VIEW, viewAt, viewAfterReading } from '../../src/frise/cascadeView.js';

describe('viewAt : changer de niveau', () => {
  test('le nouveau chemin, et l\'interrupteur de glissement basculé (l\'animation recommence)', () => {
    const view = viewAt(INITIAL_VIEW, [1]);

    expect(view.path).toEqual([1]);
    expect(view.slide).toBe(!INITIAL_VIEW.slide);
    expect(viewAt(view, []).slide).toBe(INITIAL_VIEW.slide);
  });
});

describe('viewAfterReading : la frise suit la lecture', () => {
  test('la lecture n\'a pas changé de nœud : le même état (rien à redessiner)', () => {
    const view = viewAfterReading(INITIAL_VIEW, [0, 1]);

    expect(viewAfterReading(view, [0, 1])).toBe(view);
  });

  test('vue d\'ensemble : on retient ce qu\'on lit, sans changer de niveau ni d\'animation', () => {
    const view = viewAfterReading(INITIAL_VIEW, [0, 1]);

    expect(view).toEqual({ ...INITIAL_VIEW, readingKey: '0.1' });
  });

  test('zoomé dans une époque, la lecture passe à l\'époque suivante : la frise la suit (avec glissement)', () => {
    const zoomed = viewAfterReading(viewAt(INITIAL_VIEW, [0]), [0, 1]);
    const followed = viewAfterReading(zoomed, [1, 0]);

    expect(followed.path).toEqual([1]);
    expect(followed.slide).toBe(!zoomed.slide);
  });
});
