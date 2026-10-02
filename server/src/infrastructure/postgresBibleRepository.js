// Implémentation PostgreSQL du port BibleRepository (domain/BibleRepository.js) : tout le SQL de la Bible entière.

import { VERSE_COLUMNS, VERSE_SECTION, versesByOwner } from './verseColumns.js';

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/BibleRepository.js').BibleRepository}
 */
export function createPostgresBibleRepository(pool) {
  return {
    async findChapter(bookCode, label) {
      const result = await pool.query(
        `SELECT c.position FROM chapters c JOIN books b ON b.id = c.book_id WHERE b.code = $1 AND c.label = $2`,
        [bookCode, label],
      );
      return result.rows[0] ?? null;
    },

    async findChapterPageAfter(after, limit) {
      // Un chapitre de plus que demandé : s'il existe, il reste une page après (ses versets ne sont pas chargés)
      const result = await pool.query(
        `SELECT c.id, c.position, c.label, b.code AS book_code, b.title AS book_title
         FROM chapters c
         JOIN books b ON b.id = c.book_id
         WHERE c.position > $1
         ORDER BY c.position
         LIMIT $2`,
        [after, limit + 1],
      );
      const rows = result.rows.slice(0, limit);
      const versesByChapter = await findVersesByChapterIds(pool, rows.map((row) => row.id));

      return {
        chapters: rows.map((row) => ({
          position: row.position,
          book: { code: row.book_code, title: row.book_title },
          chapter: row.label,
          verses: versesByChapter.get(row.id),
        })),
        hasMore: result.rows.length > limit,
      };
    },

    // Trois listes à plat, sans texte, chacune dans l'ordre (trois requêtes en parallèle sur des tables entières).
    // Les noms entre guillemets ("group") sont déjà ceux attendus par le domaine (buildBibleTree).
    async findBibleOutline() {
      const [groups, books, chapters, sections] = await Promise.all([
        pool.query('SELECT slug, title, icon FROM bible_groups ORDER BY position'),
        pool.query(
          `SELECT b.code, b.title, g.slug AS "group"
           FROM books b JOIN bible_groups g ON g.id = b.group_id
           ORDER BY b.position`,
        ),
        pool.query(
          `SELECT c.position, b.code AS book, c.label
           FROM chapters c JOIN books b ON b.id = c.book_id
           ORDER BY c.position`,
        ),
        pool.query(BIBLE_SECTIONS),
      ]);
      return { groups: groups.rows, books: books.rows, chapters: chapters.rows, sections: sections.rows };
    },
  };
}

// Les versets de plusieurs chapitres, en UNE requête. Renvoie une Map : id du chapitre -> ses versets.
async function findVersesByChapterIds(pool, ids) {
  const result = await pool.query(
    `SELECT c.id AS chapter_id, ${VERSE_COLUMNS}
     FROM chapters c
     JOIN verses v ON v.book_id = c.book_id AND v.chapter = c.label
     ${VERSE_SECTION}
     WHERE c.id = ANY($1)
     ORDER BY c.position, v.position`,
    [ids],
  );
  return versesByOwner(ids, result.rows, 'chapter_id');
}

// Les sous-chapitres, chacun avec son chapitre et où il commence dans ce chapitre
// (startShare : part du texte du chapitre AVANT le verset où il commence, de 0 à 1)
const BIBLE_SECTIONS = `
  SELECT c.position AS "chapterPosition", start_verse.verse, sec.title,
         COALESCE((SELECT SUM(length(v.text)) FROM verses v
                   WHERE v.book_id = start_verse.book_id AND v.chapter = start_verse.chapter
                     AND v.position < start_verse.position), 0)::float
         / (SELECT SUM(length(v.text)) FROM verses v
            WHERE v.book_id = start_verse.book_id AND v.chapter = start_verse.chapter) AS "startShare"
  FROM sections sec
  JOIN verses start_verse ON start_verse.id = sec.start_verse_id
  JOIN chapters c ON c.book_id = start_verse.book_id AND c.label = start_verse.chapter
  ORDER BY start_verse.position
`;
