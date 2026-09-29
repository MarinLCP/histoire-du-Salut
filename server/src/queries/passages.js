// Accès aux données des passages.
// Tout le SQL des passages est ici : les routes ne parlent jamais directement à la base.
// Si la source des données change un jour, seul ce fichier est à réécrire.

import { pool } from '../db.js';

// Renvoie un passage avec ses versets, ou null s'il n'existe pas.
export async function getPassageById(id) {
  const passageResult = await pool.query(
    `SELECT p.id, p.position, p.title,
            p.book_id, b.code AS book_code, b.title AS book_title,
            p.start_chapter, p.start_verse, p.end_chapter, p.end_verse
     FROM passages p
     JOIN books b ON b.id = p.book_id
     WHERE p.id = $1`,
    [id],
  );

  if (passageResult.rows.length === 0) {
    return null;
  }

  const passage = passageResult.rows[0];

  // Tous les versets entre le début et la fin, dans l'ordre de lecture.
  // On passe par la colonne position pour gérer les passages sur plusieurs chapitres.
  const versesResult = await pool.query(
    `SELECT chapter, verse, kind, text
     FROM verses
     WHERE book_id = $1
       AND position BETWEEN
         (SELECT position FROM verses WHERE book_id = $1 AND chapter = $2 AND verse = $3)
         AND
         (SELECT position FROM verses WHERE book_id = $1 AND chapter = $4 AND verse = $5)
     ORDER BY position`,
    [passage.book_id, passage.start_chapter, passage.start_verse, passage.end_chapter, passage.end_verse],
  );

  return {
    id: passage.id,
    position: passage.position,
    title: passage.title,
    book: { code: passage.book_code, title: passage.book_title },
    start: { chapter: passage.start_chapter, verse: passage.start_verse },
    end: { chapter: passage.end_chapter, verse: passage.end_verse },
    verses: versesResult.rows,
  };
}
