// Tests de ce que le seed a écrit dans la base de dev (époques, pictogrammes, liens vers les versets, grands ensembles).
// Ces tests lisent la base de dev : lancer npm run db:migrate et npm run seed avant si elle est vide.

import { describe, test, expect, afterAll } from 'vitest';
import { pool } from '../../src/infrastructure/db.js';
import { epochs } from '../../db/epochs.data.js';
import { passages } from '../../db/passages.data.js';
import { bibleGroups } from '../../db/bible-groups.data.js';
import { assignBookGroups } from '../../scripts/bibleGroupRules.js';
import { sections } from '../../db/sections.data.js';
import { characters } from '../../db/characters.data.js';

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

  test('chaque passage est relié à ses versets de début et de fin (ceux du fichier de données)', async () => {
    const { rows } = await pool.query(
      `SELECT start_book.code AS book, s.chapter AS "startChapter", s.verse AS "startVerse",
              end_book.code AS "endBook", e.chapter AS "endChapter", e.verse AS "endVerse"
       FROM passages p
       JOIN verses s ON s.id = p.start_verse_id
       JOIN verses e ON e.id = p.end_verse_id
       JOIN books start_book ON start_book.id = s.book_id
       JOIN books end_book ON end_book.id = e.book_id
       ORDER BY p.position`,
    );

    expect(rows).toEqual(passages.map(({ book, start, end }) => ({
      book, startChapter: start[0], startVerse: start[1], endBook: book, endChapter: end[0], endVerse: end[1],
    })));
  });

  test('les grands ensembles de la Bible, dans l\'ordre du fichier de données', async () => {
    const { rows } = await pool.query('SELECT slug, title, icon FROM bible_groups ORDER BY position');

    expect(rows).toEqual(bibleGroups.map(({ slug, title, icon }) => ({ slug, title, icon })));
  });

  test('chaque livre est dans son grand ensemble (LEFT JOIN : un livre sans ensemble aurait null)', async () => {
    const { rows } = await pool.query(
      'SELECT b.code, g.slug FROM books b LEFT JOIN bible_groups g ON g.id = b.group_id ORDER BY b.position',
    );
    const expected = assignBookGroups(bibleGroups, rows.map((row) => row.code));

    expect(rows.map((row) => [row.code, row.slug])).toEqual([...expected]);
  });

  test('les versets sont rangés dans l\'ordre de lecture du site (comme les chapitres : Psaumes après Job)', async () => {
    const { rows } = await pool.query(
      `SELECT MIN(v.position) AS first_verse
       FROM chapters c JOIN verses v ON v.book_id = c.book_id AND v.chapter = c.label
       GROUP BY c.position ORDER BY c.position`,
    );
    const firsts = rows.map((row) => row.first_verse);

    expect(firsts).toEqual([...firsts].sort((a, b) => a - b));
  });

  test('les sous-chapitres (en dev et en CI : propositions comprises), chacun sur son verset de début', async () => {
    const { rows } = await pool.query(
      `SELECT b.code AS book, v.chapter, v.verse, sec.title
       FROM sections sec JOIN verses v ON v.id = sec.start_verse_id JOIN books b ON b.id = v.book_id
       ORDER BY v.position`,
    );
    const key = ({ book, chapter, verse, title }) => `${book} ${chapter},${verse} ${title}`;

    expect(rows.map(key).sort()).toEqual(sections.map(({ book, start, title }) => key({ book, chapter: start[0], verse: start[1], title })).sort());
  });

  test('les personnages (en dev et en CI : propositions comprises), dans l\'ordre du fichier de données', async () => {
    const { rows } = await pool.query('SELECT slug, name FROM characters ORDER BY position');

    expect(rows).toEqual(characters.map(({ slug, name }) => ({ slug, name })));
  });

  test('les parallèles : tous écrits, reliés aux bons versets AELF (Ml 4,5 protestant = Ml 3,23)', async () => {
    const { rows: [{ count }] } = await pool.query('SELECT count(*)::int AS count FROM parallels');
    const { rows } = await pool.query(
      `SELECT tb.code AS book, ts.chapter, ts.verse, te.verse AS "endVerse"
       FROM parallels p
       JOIN verses f ON f.id = p.from_verse_id JOIN books fb ON fb.id = f.book_id
       JOIN verses ts ON ts.id = p.to_start_verse_id JOIN books tb ON tb.id = ts.book_id
       JOIN verses te ON te.id = p.to_end_verse_id
       WHERE fb.code = 'Mt' AND f.chapter = '11' AND f.verse = '14'
       ORDER BY p.votes DESC LIMIT 2`,
    );

    // 341 278 liens du fichier, dont 2 que la conversion rend identiques (2 Co 13,12-13 fusionnés)
    expect(count).toBe(341277);
    // « Jean est cet Élie qui doit venir » : les plus votés sont l'annonce d'Élie en Malachie (Ml 4,5 dans
    // les Bibles protestantes), puis la plage Mc 9,11-13
    expect(rows).toEqual([
      { book: 'Ml', chapter: '3', verse: '23', endVerse: '23' },
      { book: 'Mc', chapter: '9', verse: '11', endVerse: '13' },
    ]);
  });
});
