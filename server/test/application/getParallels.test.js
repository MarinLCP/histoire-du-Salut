// Tests unitaires du use case « les parallèles d'un verset », avec un faux repository en mémoire.

import { describe, test, expect } from 'vitest';
import { makeGetParallels } from '../../src/application/getParallels.js';

const ORIGIN = { book: 'Mt', chapter: '11', verse: '14' };
// 12 parallèles, rangés de 1 à 12
const ALL = Array.from({ length: 12 }, (_, index) => ({ position: index + 1, votes: 30 - index }));

const fakeRepository = {
  async findPageAfter(origin, after, limit) {
    if (origin.verse !== '14') return null;
    const rest = ALL.filter((parallel) => parallel.position > after);
    return { parallels: rest.slice(0, limit), hasMore: rest.length > limit };
  },
};

describe('getParallels', () => {
  const getParallels = makeGetParallels(fakeRepository);

  test('les 10 plus votés d\'abord, et le curseur pour « Voir plus »', async () => {
    const { parallels, nextCursor } = await getParallels(ORIGIN, {});

    expect(parallels.map((parallel) => parallel.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(nextCursor).toBe(10);
  });

  test('la page suivante : la fin de la liste, sans curseur', async () => {
    const { parallels, nextCursor } = await getParallels(ORIGIN, { after: '10' });

    expect(parallels.map((parallel) => parallel.position)).toEqual([11, 12]);
    expect(nextCursor).toBeNull();
  });

  test('un verset qui n\'existe pas : NotFoundError', async () => {
    await expect(getParallels({ ...ORIGIN, verse: '99' }, {})).rejects.toThrow('Verset Mt 11,99 introuvable.');
  });

  test('une limite trop grande : ValidationError (20 au plus)', async () => {
    await expect(getParallels(ORIGIN, { limit: '21' })).rejects.toThrow('entre 1 et 20');
  });
});
