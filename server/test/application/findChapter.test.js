// Tests unitaires du use case "trouver un chapitre" (pour ouvrir la Bible entière au bon endroit),
// avec un faux repository en mémoire.

import { describe, test, expect } from 'vitest';
import { makeFindChapter } from '../../src/application/findChapter.js';

const fakeRepository = {
  findChapter: async (bookCode, label) => (bookCode === 'Gn' && label === '3' ? { position: 3 } : null),
};

describe('findChapter', () => {
  const findChapter = makeFindChapter(fakeRepository);

  test('renvoie la position du chapitre dans la lecture continue', async () => {
    await expect(findChapter('Gn', '3')).resolves.toEqual({ position: 3 });
  });

  test('un chapitre qui n\'existe pas : NotFoundError', async () => {
    await expect(findChapter('Gn', '99')).rejects.toThrow('Chapitre Gn 99 introuvable.');
  });
});
