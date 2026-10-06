// Implémentation PostgreSQL du port ParallelRepository (domain/ParallelRepository.js) : le SQL des parallèles.

import { VERSE_COLUMNS, VERSE_SECTION } from './verseColumns.js';
import { rowsByOwner } from './rowsByOwner.js';

// Une plage peut être longue (jusqu'à 182 versets ; 99 % en ont 12 ou moins) : l'aperçu s'arrête à 5
const PREVIEW_VERSES = 5;

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/ParallelRepository.js').ParallelRepository}
 */
export function createPostgresParallelRepository(pool) {
  return {
    async findPageAfter({ book, chapter, verse }, after, limit) {
      const origin = await pool.query(
        'SELECT v.id FROM verses v JOIN books b ON b.id = v.book_id WHERE b.code = $1 AND v.chapter = $2 AND v.verse = $3',
        [book, chapter, verse],
      );
      if (origin.rows.length === 0) return null;

      // Un parallèle de plus que demandé : s'il existe, il reste une page après
      const result = await pool.query(PARALLEL_PAGE, [origin.rows[0].id, after, limit + 1]);
      const rows = result.rows.slice(0, limit);
      const versesByParallel = await findPreviewVerses(pool, rows);

      return { parallels: rows.map((row) => toParallel(row, versesByParallel.get(row.position))), hasMore: result.rows.length > limit };
    },
  };
}

// Les parallèles d'un verset, rangés : les plus votés d'abord, puis dans l'ordre de la Bible.
// position = ce rang (calculé avant le filtre « après tel rang », pour la page suivante)
const PARALLEL_PAGE = `
  SELECT * FROM (
    SELECT row_number() OVER (ORDER BY p.votes DESC, s.position, e.position)::int AS position, p.votes,
           sb.code AS start_book, s.chapter AS start_chapter, s.verse AS start_verse, s.position AS first_position,
           eb.code AS end_book, e.chapter AS end_chapter, e.verse AS end_verse, e.position AS last_position
    FROM parallels p
    JOIN verses s ON s.id = p.to_start_verse_id JOIN books sb ON sb.id = s.book_id
    JOIN verses e ON e.id = p.to_end_verse_id JOIN books eb ON eb.id = e.book_id
    WHERE p.from_verse_id = $1
  ) ranked
  WHERE position > $2
  ORDER BY position
  LIMIT $3
`;

// Les premiers versets de chaque plage, en UNE requête. Renvoie une Map : rang du parallèle -> ses versets.
async function findPreviewVerses(pool, rows) {
  const positions = rows.map((row) => row.position);
  const result = await pool.query(
    `SELECT r.position AS parallel_position, ${VERSE_COLUMNS}
     FROM unnest($1::int[], $2::int[], $3::int[]) AS r(position, first_position, last_position)
     JOIN verses v ON v.position BETWEEN r.first_position AND LEAST(r.last_position, r.first_position + $4 - 1)
     ${VERSE_SECTION}
     ORDER BY r.position, v.position`,
    [positions, rows.map((row) => row.first_position), rows.map((row) => row.last_position), PREVIEW_VERSES],
  );
  return rowsByOwner(positions, result.rows, 'parallel_position');
}

function toParallel(row, verses) {
  return {
    position: row.position,
    votes: row.votes,
    start: { book: row.start_book, chapter: row.start_chapter, verse: row.start_verse },
    end: { book: row.end_book, chapter: row.end_chapter, verse: row.end_verse },
    verses,
    isTruncated: row.last_position - row.first_position + 1 > PREVIEW_VERSES,
  };
}
