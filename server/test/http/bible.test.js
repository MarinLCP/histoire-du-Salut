// Tests de l'API de la Bible entière : GET /api/bible et la position d'un chapitre (supertest + base de dev).
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

describe('GET /api/bible', () => {
  test('commence au premier chapitre de la Genèse, avec ses versets', async () => {
    const res = await request(app).get('/api/bible');

    expect(res.status).toBe(200);
    expect(res.body.chapters[0]).toMatchObject({ book: { code: 'Gn' }, chapter: '1' });
    expect(res.body.chapters[0].verses.length).toBeGreaterThan(0);
  });

  test('chaque verset porte son chapitre (comme dans /api/passages) : sa référence en dépend (ex. "Gn 1,1")', async () => {
    const res = await request(app).get('/api/bible?limit=2');

    for (const chapter of res.body.chapters) {
      expect(chapter.verses.every((verse) => verse.chapter === chapter.chapter)).toBe(true);
    }
  });

  test('en lisant jusqu\'au bout : tous les chapitres, une seule fois, dans l\'ordre des livres', async () => {
    const [{ rows: [{ count }] }, chapters] = await Promise.all([
      pool.query('SELECT count(*)::int AS count FROM chapters'), readWholeBible(),
    ]);
    const keys = chapters.map((chapter) => `${chapter.book.code} ${chapter.chapter}`);

    expect(chapters).toHaveLength(count);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('Ps 9A');
  });

  test('les 74 livres, de la Genèse à l\'Apocalypse, avec les Psaumes juste après Job', async () => {
    const bookOrder = [...new Set((await readWholeBible()).map((chapter) => chapter.book.code))];

    expect(bookOrder).toHaveLength(74);
    expect([bookOrder[0], bookOrder.at(-1)]).toEqual(['Gn', 'Ap']);
    expect(bookOrder[bookOrder.indexOf('Jb') + 1]).toBe('Ps');
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

describe('GET /api/books/:code/chapters/:chapter', () => {
  test('donne la position d\'un chapitre : la lecture continue peut commencer juste avant', async () => {
    const first = await request(app).get('/api/books/Gn/chapters/1');
    const third = await request(app).get('/api/books/Gn/chapters/3');

    expect(first.status).toBe(200);
    expect(third.body.position).toBe(first.body.position + 2);
  });

  test('trouve aussi les chapitres aux numéros spéciaux (Ps 9A)', async () => {
    const res = await request(app).get('/api/books/Ps/chapters/9A');

    expect(res.status).toBe(200);
  });

  test.each(['/api/books/Gn/chapters/999', '/api/books/Xx/chapters/1'])('renvoie 404 pour %s', async (address) => {
    const res = await request(app).get(address);

    expect(res.status).toBe(404);
  });
});
