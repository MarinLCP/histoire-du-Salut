// Tests unitaires du use case "une page de la timeline", avec un FAUX repository en mémoire.

import { describe, test, expect } from 'vitest';
import { makeGetTimeline } from '../../src/application/getTimeline.js';
import { ValidationError } from '../../src/domain/errors.js';

// 7 faux passages, positions 1 à 7
const allPassages = Array.from({ length: 7 }, (_, index) => ({ position: index + 1 }));

const fakeRepository = {
  findPageAfter: async (after, limit) => {
    const following = allPassages.filter((passage) => passage.position > after);
    return { passages: following.slice(0, limit), hasMore: following.length > limit };
  },
};

const positionsOf = (page) => page.passages.map((passage) => passage.position);

describe('getTimeline', () => {
  const getTimeline = makeGetTimeline(fakeRepository);

  test('renvoie une page et le curseur de la suivante', async () => {
    const page = await getTimeline({ after: '0', limit: '3' });

    expect(positionsOf(page)).toEqual([1, 2, 3]);
    expect(page.nextCursor).toBe(3);
  });

  test('la dernière page, même pleine, annonce qu\'il n\'y a plus rien', async () => {
    const page = await getTimeline({ after: '4', limit: '3' });

    expect(positionsOf(page)).toEqual([5, 6, 7]);
    expect(page.nextCursor).toBeNull();
  });

  test('après la fin : une page vide, sans erreur', async () => {
    const page = await getTimeline({ after: '7' });

    expect(page).toEqual({ passages: [], nextCursor: null });
  });

  test('des paramètres invalides : ValidationError', async () => {
    await expect(getTimeline({ limit: '0' })).rejects.toThrow(ValidationError);
  });
});
