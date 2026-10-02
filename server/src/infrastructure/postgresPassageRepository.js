// Implémentation PostgreSQL du port PassageRepository (domain/PassageRepository.js).
// C'est le SEUL endroit qui contient le SQL des passages : si la source des données change
// un jour, on écrit un autre repository qui respecte le même contrat, sans toucher au reste.

import { VERSE_COLUMNS } from './verseColumns.js';

// Début commun des requêtes qui lisent des passages (p = passages, b = books) :
// chaque requête n'ajoute que son WHERE / ORDER BY
const SELECT_PASSAGES = `
  SELECT p.id, p.position, p.slug, p.title,
         b.code AS book_code, b.title AS book_title,
         p.start_chapter, p.start_verse, p.end_chapter, p.end_verse
  FROM passages p
  JOIN books b ON b.id = p.book_id
`;

/**
 * @param {import('pg').Pool} pool
 * @returns {import('../domain/PassageRepository.js').PassageRepository}
 */
export function createPostgresPassageRepository(pool) {
  return {
    async findBySlug(slug) {
      const result = await pool.query(
        `${SELECT_PASSAGES} WHERE p.slug = $1`,
        [slug.value],
      );
      const [passage] = await withVerses(pool, result.rows);
      return passage ?? null;
    },

    async findPageAfter(after, limit) {
      // On lit un passage de plus que demandé : s'il existe, il reste une page après.
      // Ses versets, eux, ne sont pas chargés : il ne sera pas renvoyé.
      const result = await pool.query(
        `${SELECT_PASSAGES} WHERE p.position > $1 ORDER BY p.position LIMIT $2`,
        [after, limit + 1],
      );
      return {
        passages: await withVerses(pool, result.rows.slice(0, limit)),
        hasMore: result.rows.length > limit,
      };
    },
  };
}

// Ajoute leurs versets à des lignes de passages. Toujours UNE requête, quel que soit le nombre de passages.
async function withVerses(pool, rows) {
  if (rows.length === 0) return [];

  const versesByPassage = await findVersesByPassageIds(pool, rows.map((row) => row.id));
  return rows.map((row) => toPassage(row, versesByPassage.get(row.id)));
}

// Renvoie une Map : id du passage -> liste de ses versets (dans l'ordre de lecture).
async function findVersesByPassageIds(pool, ids) {
  // s = verset de début, e = verset de fin, v = tous les versets entre les deux.
  // La colonne position gère les passages sur plusieurs chapitres.
  // = ANY($1) : "l'id fait partie de ce tableau", comme un IN (...) avec un tableau JS
  const result = await pool.query(
    `SELECT p.id AS passage_id, ${VERSE_COLUMNS}
     FROM passages p
     JOIN verses s ON s.book_id = p.book_id AND s.chapter = p.start_chapter AND s.verse = p.start_verse
     JOIN verses e ON e.book_id = p.book_id AND e.chapter = p.end_chapter AND e.verse = p.end_verse
     JOIN verses v ON v.position BETWEEN s.position AND e.position
     WHERE p.id = ANY($1)
     ORDER BY p.position, v.position`,
    [ids],
  );

  // On range chaque ligne dans la liste de son passage
  const versesByPassage = new Map(ids.map((id) => [id, []]));
  for (const { passage_id, ...verse } of result.rows) {
    versesByPassage.get(passage_id).push(verse);
  }
  return versesByPassage;
}

// Transforme une ligne SQL (colonnes à plat) en passage (objets imbriqués)
function toPassage(row, verses) {
  return {
    id: row.id,
    position: row.position,
    slug: row.slug,
    title: row.title,
    book: { code: row.book_code, title: row.book_title },
    start: { chapter: row.start_chapter, verse: row.start_verse },
    end: { chapter: row.end_chapter, verse: row.end_verse },
    verses,
  };
}
