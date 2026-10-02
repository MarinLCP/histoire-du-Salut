// Implémentation PostgreSQL du port PassageRepository (domain/PassageRepository.js).
// C'est le SEUL endroit qui contient le SQL des passages : si la source des données change
// un jour, on écrit un autre repository qui respecte le même contrat, sans toucher au reste.

import { VERSE_COLUMNS } from './verseColumns.js';

// Début commun des requêtes qui lisent des passages (p = passages, s / e = versets de début et de fin,
// b = livre du verset de début) : chaque requête n'ajoute que son WHERE / ORDER BY
const SELECT_PASSAGES = `
  SELECT p.id, p.position, p.slug, p.title,
         b.code AS book_code, b.title AS book_title,
         s.chapter AS start_chapter, s.verse AS start_verse, e.chapter AS end_chapter, e.verse AS end_verse
  FROM passages p
  JOIN verses s ON s.id = p.start_verse_id
  JOIN verses e ON e.id = p.end_verse_id
  JOIN books b ON b.id = s.book_id
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

    // Trois listes à plat, sans texte, chacune dans l'ordre (trois requêtes en parallèle).
    // Les noms entre guillemets sont déjà ceux attendus par le domaine (buildHistoryTree).
    async findHistoryOutline() {
      const [epochs, episodes, chapters] = await Promise.all([
        pool.query('SELECT slug, title, icon FROM epochs ORDER BY position'),
        pool.query(
          `SELECT p.position, p.title, p.icon, e.slug AS epoch
           FROM passages p JOIN epochs e ON e.id = p.epoch_id
           ORDER BY p.position`,
        ),
        pool.query(COVERED_CHAPTERS),
      ]);
      return { epochs: epochs.rows, episodes: episodes.rows, chapters: chapters.rows };
    },
  };
}

// Les chapitres couverts par chaque passage : pour chacun, le premier et le dernier verset du passage DANS
// ce chapitre, et s'il part du début du chapitre / va jusqu'à sa fin (comparaison avec les bornes du chapitre).
//   covered : les versets du passage, regroupés par chapitre (première et dernière position)
//   bounds  : la première et la dernière position de chaque chapitre couvert
const COVERED_CHAPTERS = `
  WITH covered AS (
    SELECT p.position AS passage_position, v.book_id, v.chapter,
           MIN(v.position) AS first_position, MAX(v.position) AS last_position
    FROM passages p
    JOIN verses s ON s.id = p.start_verse_id
    JOIN verses e ON e.id = p.end_verse_id
    JOIN verses v ON v.position BETWEEN s.position AND e.position
    GROUP BY p.position, v.book_id, v.chapter
  ),
  bounds AS (
    SELECT v.book_id, v.chapter, MIN(v.position) AS first_position, MAX(v.position) AS last_position
    FROM verses v
    JOIN covered USING (book_id, chapter)
    GROUP BY v.book_id, v.chapter
  )
  SELECT covered.passage_position AS "passagePosition", b.title AS "bookTitle", c.label,
         first_verse.verse AS "fromVerse", last_verse.verse AS "toVerse",
         covered.first_position = bounds.first_position AS "startsChapter",
         covered.last_position = bounds.last_position AS "endsChapter"
  FROM covered
  JOIN bounds USING (book_id, chapter)
  JOIN books b ON b.id = covered.book_id
  JOIN chapters c ON c.book_id = covered.book_id AND c.label = covered.chapter
  JOIN verses first_verse ON first_verse.position = covered.first_position
  JOIN verses last_verse ON last_verse.position = covered.last_position
  ORDER BY covered.passage_position, c.position
`;

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
     JOIN verses s ON s.id = p.start_verse_id
     JOIN verses e ON e.id = p.end_verse_id
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
