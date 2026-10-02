// Tests de ce que le seed a écrit dans la base de dev (époques, pictogrammes, liens vers les versets).
// Ces tests lisent la base de dev : lancer npm run db:migrate et npm run seed avant si elle est vide.

import { describe, test, expect, afterAll } from 'vitest';
import { pool } from '../../src/infrastructure/db.js';
import { epochs } from '../../db/epochs.data.js';
import { passages } from '../../db/passages.data.js';

afterAll(() => pool.end());

describe('base remplie par le seed', () => {
  test('les époques, dans l\'ordre du fichier de données', async () => {
    const { rows } = await pool.query('SELECT slug, title, icon FROM epochs ORDER BY position');

    expect(rows).toEqual(epochs.map(({ slug, title, icon }) => ({ slug, title, icon })));
  });

  test('chaque passage a son époque et son pictogramme', async () => {
    const { rows } = await pool.query(
      'SELECT p.slug, e.slug AS epoch, p.icon FROM passages p JOIN epochs e ON e.id = p.epoch_id ORDER BY p.position',
    );

    expect(rows).toEqual(passages.map(({ slug, epoch, icon }) => ({ slug, epoch, icon })));
  });

  test('chaque passage est relié à ses versets de début et de fin (les mêmes que les colonnes texte)', async () => {
    const { rows } = await pool.query(
      `SELECT p.slug FROM passages p
       JOIN verses s ON s.id = p.start_verse_id
       JOIN verses e ON e.id = p.end_verse_id
       WHERE s.book_id = p.book_id AND s.chapter = p.start_chapter AND s.verse = p.start_verse
         AND e.book_id = p.book_id AND e.chapter = p.end_chapter AND e.verse = p.end_verse`,
    );

    expect(rows).toHaveLength(passages.length);
  });
});
