// Les versets dans les repositories : leurs colonnes, et leur rangement par propriétaire (passage, chapitre).
// Les colonnes d'un verset renvoyées par l'API (contrat Verse, domain/PassageRepository.js).
// UNE seule liste, partagée par tous les repositories : un verset ne peut pas perdre un champ
// dans une requête et pas dans l'autre (ex. sans "chapter", la référence "Gn 1,1" devenait "Gn undefined,1").
export const VERSE_COLUMNS = 'v.chapter, v.verse, v.kind, v.text, sec.title AS "sectionTitle"';
// L'intertitre éventuel d'un verset (le sous-chapitre qui commence à ce verset) : à placer après « verses v »
export const VERSE_SECTION = 'LEFT JOIN sections sec ON sec.start_verse_id = v.id';

// Range des lignes SQL « propriétaire + verset » dans une Map : id du propriétaire -> ses versets, dans l'ordre.
// ownerColumn : la colonne qui porte l'id du propriétaire (ex. "passage_id", "chapter_id"), retirée du verset.
// Chaque id demandé a sa liste, même vide.
export function versesByOwner(ids, rows, ownerColumn) {
  const verses = new Map(ids.map((id) => [id, []]));
  for (const { [ownerColumn]: ownerId, ...verse } of rows) {
    verses.get(ownerId).push(verse);
  }
  return verses;
}
