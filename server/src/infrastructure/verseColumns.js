// Les colonnes d'un verset renvoyées par l'API (contrat Verse, domain/PassageRepository.js).
// UNE seule liste, partagée par tous les repositories : un verset ne peut pas perdre un champ
// dans une requête et pas dans l'autre (ex. sans "chapter", la référence "Gn 1,1" devenait "Gn undefined,1").
export const VERSE_COLUMNS = 'v.chapter, v.verse, v.kind, v.text';
