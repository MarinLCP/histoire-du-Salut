// Accès aux données des passages.
// Tout le SQL des passages est ici : les routes ne parlent jamais directement à la base.
// Si la source des données change un jour, seul ce fichier est à réécrire.

import { pool } from '../db.js';

// Colonnes communes aux requêtes qui lisent des passages (p = passages, b = books)
const PASSAGE_COLUMNS = `
  p.id, p.position, p.title,
  b.code AS book_code, b.title AS book_title,
  p.start_chapter, p.start_verse, p.end_chapter, p.end_verse
`;

// Renvoie un passage avec ses versets, ou null s'il n'existe pas.
export async function getPassageById(id) {
  const result = await pool.query(
    `SELECT ${PASSAGE_COLUMNS}
     FROM passages p
     JOIN books b ON b.id = p.book_id
     WHERE p.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const versesByPassage = await findVersesByPassageIds([id]);
  return toPassage(result.rows[0], versesByPassage);
}

// Renvoie les `limit` passages qui suivent la position `after`, avec leurs versets.
// nextCursor = la position à passer en `after` pour la page suivante, ou null s'il n'y en a plus.
// Toujours 2 requêtes, quelle que soit la taille de la page.
export async function getTimeline(after, limit) {
  // On demande un passage de plus que nécessaire : s'il existe, il reste une page après.
  const result = await pool.query(
    `SELECT ${PASSAGE_COLUMNS}
     FROM passages p
     JOIN books b ON b.id = p.book_id
     WHERE p.position > $1
     ORDER BY p.position
     LIMIT $2`,
    [after, limit + 1],
  );

  const hasMore = result.rows.length > limit;
  const rows = result.rows.slice(0, limit);

  const versesByPassage = await findVersesByPassageIds(rows.map((row) => row.id));
  const passages = rows.map((row) => toPassage(row, versesByPassage));

  return {
    passages,
    nextCursor: hasMore ? passages.at(-1).position : null,
  };
}

// Récupère en UNE requête les versets de plusieurs passages.
// Renvoie une Map : id du passage -> liste de ses versets (dans l'ordre de lecture).
async function findVersesByPassageIds(ids) {
  // s = verset de début, e = verset de fin, v = tous les versets entre les deux.
  // La colonne position gère les passages sur plusieurs chapitres.
  // = ANY($1) : "l'id fait partie de ce tableau", comme un IN (...) avec un tableau JS
  const result = await pool.query(
    `SELECT p.id AS passage_id, v.chapter, v.verse, v.kind, v.text
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

// Transforme une ligne SQL en objet renvoyé par l'API
function toPassage(row, versesByPassage) {
  return {
    id: row.id,
    position: row.position,
    title: row.title,
    book: { code: row.book_code, title: row.book_title },
    start: { chapter: row.start_chapter, verse: row.start_verse },
    end: { chapter: row.end_chapter, verse: row.end_verse },
    verses: versesByPassage.get(row.id),
  };
}
