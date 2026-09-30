// Tests de GET /api/passages/:slug : on envoie de fausses requêtes HTTP à l'app avec supertest.
// Ces tests lisent la base de dev : lancer npm run seed avant si elle est vide.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/db.js';

// Ferme les connexions à Postgres à la fin, sinon le processus reste ouvert
afterAll(() => pool.end());

describe('GET /api/passages/:slug', () => {
  test('renvoie un passage avec ses versets', async () => {
    const res = await request(app).get('/api/passages/creation');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('creation');
    expect(res.body.title).toBe('La Création');
    expect(res.body.book).toEqual({ code: 'Gn', title: 'La Genèse' });
    expect(res.body.verses.length).toBeGreaterThan(0);
  });

  test('commence et finit aux bonnes bornes, même sur deux chapitres', async () => {
    // Le Serviteur souffrant : Is 52,13 – 53,12
    const res = await request(app).get('/api/passages/serviteur-souffrant');
    const verses = res.body.verses;

    expect(verses[0]).toMatchObject({ chapter: '52', verse: '13' });
    expect(verses.at(-1)).toMatchObject({ chapter: '53', verse: '12' });
    expect(verses.length).toBe(15);
  });

  test.each(['passage-inconnu', '1', 'CREATION'])('renvoie 404 pour le slug inconnu "%s"', async (slug) => {
    const res = await request(app).get(`/api/passages/${slug}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
