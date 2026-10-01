// Tests de GET /api/passages/:slug : on envoie de fausses requêtes HTTP à l'app avec supertest.
// Ces tests lisent la base de dev : lancer npm run seed avant si elle est vide.
// Ils ne supposent rien du CONTENU des passages (bornes, nombre de versets) : on peut retravailler
// db/passages.data.js sans les casser. Seul le slug "creation" est utilisé, et un slug ne change jamais.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/infrastructure/db.js';

// Ferme les connexions à Postgres à la fin, sinon le processus reste ouvert
afterAll(() => pool.end());

// Tous les slugs, lus page par page dans la timeline (comme le ferait le front)
async function allSlugs() {
  const slugs = [];
  let after = 0;
  while (after !== null) {
    const res = await request(app).get(`/api/timeline?after=${after}&limit=20`);
    slugs.push(...res.body.passages.map((passage) => passage.slug));
    after = res.body.nextCursor;
  }
  return slugs;
}

describe('GET /api/passages/:slug', () => {
  test('renvoie un passage avec ses versets', async () => {
    const res = await request(app).get('/api/passages/creation');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('creation');
    expect(res.body.book.code).toBe('Gn');
    expect(res.body.verses.length).toBeGreaterThan(0);
  });

  test('chaque passage commence et finit exactement à ses bornes (même sur plusieurs chapitres)', async () => {
    for (const slug of await allSlugs()) {
      const { body: passage } = await request(app).get(`/api/passages/${slug}`);

      expect(passage.verses[0], slug).toMatchObject(passage.start);
      expect(passage.verses.at(-1), slug).toMatchObject(passage.end);
    }
  });

  test.each(['passage-inconnu', '1', 'CREATION'])('renvoie 404 pour le slug inconnu "%s"', async (slug) => {
    const res = await request(app).get(`/api/passages/${slug}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
