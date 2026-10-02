// Tests unitaires des use cases de la Bible entière, avec un faux repository (sans base).

import { describe, test, expect } from 'vitest';
import { makeListBooks } from '../../src/application/listBooks.js';
import { makeReadBible } from '../../src/application/readBible.js';
import { ValidationError } from '../../src/domain/errors.js';

// 7 faux chapitres, positions 1 à 7
const allChapters = Array.from({ length: 7 }, (_, index) => ({ position: index + 1 }));

const fakeRepository = {
  findBooks: async () => [{ code: 'Gn', title: 'La Genèse', chapterCount: 50 }],
  findChapterPageAfter: async (after, limit) => {
    const following = allChapters.filter((chapter) => chapter.position > after);
    return { chapters: following.slice(0, limit), hasMore: following.length > limit };
  },
};

const positionsOf = (page) => page.chapters.map((chapter) => chapter.position);

describe('listBooks', () => {
  test('renvoie les livres du repository', async () => {
    await expect(makeListBooks(fakeRepository)()).resolves.toEqual([{ code: 'Gn', title: 'La Genèse', chapterCount: 50 }]);
  });
});

describe('readBible', () => {
  const readBible = makeReadBible(fakeRepository);

  test('par défaut : 2 chapitres depuis le début, et le curseur de la suite', async () => {
    const page = await readBible({});

    expect(positionsOf(page)).toEqual([1, 2]);
    expect(page.nextCursor).toBe(2);
  });

  test('la dernière page annonce qu\'il n\'y a plus rien', async () => {
    const page = await readBible({ after: '5', limit: '5' });

    expect(positionsOf(page)).toEqual([6, 7]);
    expect(page.nextCursor).toBeNull();
  });

  test('au plus 5 chapitres par page (un chapitre peut être long)', async () => {
    await expect(readBible({ limit: '6' })).rejects.toThrow(ValidationError);
  });
});
