// Le classement des parallèles d'un verset, partagé par la marge de la Bible entière (verseColumns.js) et par le
// panneau « Voir les parallèles » (postgresParallelRepository.js) : les 3 de la marge sont toujours les 3
// premiers du panneau.
// - PARALLELS_FROM : un parallèle (p), le verset de début de sa plage (s, livre sb) et celui de fin (e, livre eb) ;
// - PARALLEL_RANK : les plus votés d'abord, puis dans l'ordre de la Bible.

export const PARALLELS_FROM = `
  FROM parallels p
  JOIN verses s ON s.id = p.to_start_verse_id JOIN books sb ON sb.id = s.book_id
  JOIN verses e ON e.id = p.to_end_verse_id JOIN books eb ON eb.id = e.book_id
`;

export const PARALLEL_RANK = 'ORDER BY p.votes DESC, s.position, e.position';
