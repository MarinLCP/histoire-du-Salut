// Implémentation PostgreSQL du port BibleRepository (domain/BibleRepository.js) : tout le SQL de la Bible entière.

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/BibleRepository.js').BibleRepository}
 */
export function createPostgresBibleRepository(pool) {
  return {
    async findBooks() {
      const result = await pool.query(
        `SELECT b.code, b.title, b.position, count(c.id)::int AS chapter_count
         FROM books b
         JOIN chapters c ON c.book_id = b.id
         GROUP BY b.id
         ORDER BY b.position`,
      );
      return result.rows.map((row) => ({ code: row.code, title: row.title, position: row.position, chapterCount: row.chapter_count }));
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
  };
}

// Les versets de plusieurs chapitres, en UNE requête. Renvoie une Map : id du chapitre -> ses versets.
async function findVersesByChapterIds(pool, ids) {
  const result = await pool.query(
    `SELECT c.id AS chapter_id, v.verse, v.kind, v.text
     FROM chapters c
     JOIN verses v ON v.book_id = c.book_id AND v.chapter = c.label
     WHERE c.id = ANY($1)
     ORDER BY c.position, v.position`,
    [ids],
  );

  const versesByChapter = new Map(ids.map((id) => [id, []]));
  for (const { chapter_id, ...verse } of result.rows) {
    versesByChapter.get(chapter_id).push(verse);
  }
  return versesByChapter;
}
