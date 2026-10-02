// Tests de l'API de la Bible entière : GET /api/books et GET /api/bible (supertest + base de dev).
// Ces tests lisent la base de dev : lancer npm run db:migrate et npm run seed avant si elle est vide.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/infrastructure/db.js';

afterAll(() => pool.end());

// Toute la Bible, page par page, comme le fera le défilement continu
async function readWholeBible() {
  const chapters = [];
  let after = 0;
  for (let pageCount = 0; after !== null && pageCount < 1000; pageCount++) {
    const res = await request(app).get(`/api/bible?after=${after}&limit=5`);
    chapters.push(...res.body.chapters);
    after = res.body.nextCursor;
  }
  return chapters;
}

describe('GET /api/books', () => {
  test('les 74 livres, de la Genèse à l\'Apocalypse, avec les Psaumes juste après Job', async () => {
    const res = await request(app).get('/api/books');
    const codes = res.body.map((book) => book.code);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(74);
    expect(codes[0]).toBe('Gn');
    expect(codes.at(-1)).toBe('Ap');
    expect(codes[codes.indexOf('Jb') + 1]).toBe('Ps');
    expect(res.body[0]).toMatchObject({ code: 'Gn', title: 'La Genèse' });
    expect(res.body[0].chapterCount).toBeGreaterThan(0);
  });
});

describe('GET /api/bible', () => {
  test('commence au premier chapitre de la Genèse, avec ses versets', async () => {
    const res = await request(app).get('/api/bible');

    expect(res.status).toBe(200);
    expect(res.body.chapters[0]).toMatchObject({ book: { code: 'Gn' }, chapter: '1' });
    expect(res.body.chapters[0].verses.length).toBeGreaterThan(0);
  });

  test('en lisant jusqu\'au bout : tous les chapitres, une seule fois, dans l\'ordre des livres', async () => {
    const [books, chapters] = await Promise.all([request(app).get('/api/books'), readWholeBible()]);
    const totalChapters = books.body.reduce((sum, book) => sum + book.chapterCount, 0);
    const keys = chapters.map((chapter) => `${chapter.book.code} ${chapter.chapter}`);

    expect(chapters).toHaveLength(totalChapters);
    expect(new Set(keys).size).toBe(keys.length);
    const bookOrder = [...new Set(chapters.map((chapter) => chapter.book.code))];
    expect(bookOrder).toEqual(books.body.map((book) => book.code));
    expect(keys).toContain('Ps 9A');
  });

  test('après le dernier chapitre : une page vide, et ce n\'est pas une erreur', async () => {
    const res = await request(app).get('/api/bible?after=999999');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ chapters: [], nextCursor: null });
  });

  test.each(['limit=6', 'after=-1'])('renvoie 400 pour ?%s', async (query) => {
    const res = await request(app).get(`/api/bible?${query}`);

    expect(res.status).toBe(400);
  });
});
