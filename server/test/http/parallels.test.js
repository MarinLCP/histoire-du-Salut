// Tests de l'API des parallèles : GET /api/books/:code/chapters/:chapter/verses/:verse/parallels
// (supertest + base de dev). Lancer npm run db:migrate et npm run seed avant si elle est vide.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/infrastructure/db.js';

afterAll(() => pool.end());

const URL_MT_11_14 = '/api/books/Mt/chapters/11/verses/14/parallels';

describe('GET .../verses/:verse/parallels', () => {
  test('les plus votés d\'abord, convertis en références AELF, avec le texte', async () => {
    const res = await request(app).get(URL_MT_11_14);
    const [first, second] = res.body.parallels;

    expect(res.status).toBe(200);
    // Ml 4,5 dans les Bibles protestantes = Ml 3,23 dans l'AELF
    expect(first).toMatchObject({
      position: 1, votes: 21, isTruncated: false,
      start: { book: 'Ml', chapter: '3', verse: '23' }, end: { book: 'Ml', chapter: '3', verse: '23' },
    });
    expect(first.verses).toHaveLength(1);
    expect(first.verses[0].text).toContain('Élie');
    // Une plage : Mc 9,11-13, ses trois versets
    expect(second.verses.map((verse) => verse.verse)).toEqual(['11', '12', '13']);
  });

  test('10 par défaut, puis la suite avec after (« Voir plus »), sans doublon', async () => {
    // Jn 3,16 a 23 parallèles : 10, 10, puis 3
    const url = '/api/books/Jn/chapters/3/verses/16/parallels';
    const pages = [await request(app).get(url)];
    while (pages.at(-1).body.nextCursor !== null) {
      pages.push(await request(app).get(`${url}?after=${pages.at(-1).body.nextCursor}`));
    }
    const positions = pages.flatMap((page) => page.body.parallels.map((parallel) => parallel.position));

    expect(pages.map((page) => page.body.parallels.length)).toEqual([10, 10, 3]);
    expect(positions).toEqual(positions.map((_, index) => index + 1));
  });

  test('une longue plage : un aperçu de 5 versets, marqué tronqué', async () => {
    // Le parallèle le plus long du fichier (182 versets)
    const { rows: [longest] } = await pool.query(
      `SELECT b.code, f.chapter, f.verse FROM parallels p
       JOIN verses f ON f.id = p.from_verse_id JOIN books b ON b.id = f.book_id
       JOIN verses s ON s.id = p.to_start_verse_id JOIN verses e ON e.id = p.to_end_verse_id
       ORDER BY e.position - s.position DESC LIMIT 1`,
    );
    const res = await request(app).get(`/api/books/${longest.code}/chapters/${longest.chapter}/verses/${longest.verse}/parallels?limit=20`);
    const truncated = res.body.parallels.find((parallel) => parallel.isTruncated);

    expect(truncated.verses).toHaveLength(5);
  });

  test('un verset sans parallèle (ajout grec de Daniel) : une liste vide, pas une erreur', async () => {
    const res = await request(app).get('/api/books/Dn/chapters/3/verses/50/parallels');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ parallels: [], nextCursor: null });
  });

  test('un verset qui n\'existe pas : 404', async () => {
    const res = await request(app).get('/api/books/Mt/chapters/11/verses/999/parallels');

    expect(res.status).toBe(404);
  });
});
