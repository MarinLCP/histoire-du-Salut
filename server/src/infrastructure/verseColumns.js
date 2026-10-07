// Les colonnes d'un verset renvoyées par l'API (contrat Verse, domain/PassageRepository.js).
// UNE seule liste, partagée par tous les repositories : un verset ne peut pas perdre un champ
// dans une requête et pas dans l'autre (ex. sans "chapter", la référence "Gn 1,1" devenait "Gn undefined,1").

import { PARALLELS_FROM, PARALLEL_RANK } from './parallelRank.js';

export const VERSE_COLUMNS = 'v.chapter, v.verse, v.kind, v.text, sec.title AS "sectionTitle"';
// L'intertitre éventuel d'un verset (le sous-chapitre qui commence à ce verset) : à placer après « verses v »
export const VERSE_SECTION = 'LEFT JOIN sections sec ON sec.start_verse_id = v.id';

// La marge de la Bible entière (pas des épisodes) : les parallèles les plus votés de chaque verset, rangés AVEC
// lui (en JSON), pour que le texte s'affiche une seule fois, déjà complet (pas de saut quand la marge arrive). À placer après
// VERSE_SECTION, avec la colonne VERSE_MARGIN_COLUMN. Une sous-requête par verset (LATERAL), servie par la
// clé primaire de parallels (from_verse_id en tête). Classement partagé avec le panneau : parallelRank.js.
const MARGIN_PARALLELS = 3;

export const VERSE_MARGIN = `
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object(
             'start', json_build_object('book', top.start_book, 'chapter', top.start_chapter, 'verse', top.start_verse),
             'end', json_build_object('book', top.end_book, 'chapter', top.end_chapter, 'verse', top.end_verse)
           ) ORDER BY top.rank) AS parallels
    FROM (
      SELECT sb.code AS start_book, s.chapter AS start_chapter, s.verse AS start_verse,
             eb.code AS end_book, e.chapter AS end_chapter, e.verse AS end_verse,
             row_number() OVER (${PARALLEL_RANK}) AS rank
      ${PARALLELS_FROM}
      WHERE p.from_verse_id = v.id
      ORDER BY rank
      LIMIT ${MARGIN_PARALLELS}
    ) top
  ) margin ON true
`;
export const VERSE_MARGIN_COLUMN = `COALESCE(margin.parallels, '[]'::json) AS parallels`;
