// Les personnages (db/characters.data.js) : leurs règles (vérifiées par le seed AVANT de toucher à la base),
// et le calcul de leurs apparitions dans les épisodes, par la recherche de leurs noms dans le texte AELF.
// Fonctions pures, testées.

import { isIdentifier } from '../src/domain/identifier.js';
import { validateStatus } from './dataStatus.js';

// passageSlugs : les slugs des épisodes ; bookCodes : les codes des livres. Lève une erreur au premier problème.
export function validateCharacters(characters, { passageSlugs, bookCodes }) {
  const slugs = characters.map((character) => character.slug);
  characters.forEach((character, index) => {
    const where = `Personnage "${character.name}"`;
    validateStatus(character, where);
    if (!isIdentifier(character.slug)) throw new Error(`${where} : slug "${character.slug}" mal formé.`);
    if (slugs.indexOf(character.slug) !== index) throw new Error(`${where} : slug "${character.slug}" déjà utilisé.`);
    validateSearch(character, where, { passageSlugs, bookCodes });
  });
}

function validateSearch(character, where, { passageSlugs, bookCodes }) {
  if (character.searchNames.length === 0) throw new Error(`${where} : aucun nom à chercher.`);
  const unknownBook = character.books.find((code) => !bookCodes.includes(code));
  if (unknownBook) throw new Error(`${where} : livre ${unknownBook} introuvable.`);
  const unknownPassage = character.notIn.find((slug) => !passageSlugs.includes(slug));
  if (unknownPassage) throw new Error(`${where} : épisode "${unknownPassage}" introuvable.`);
}

// Les apparitions : pour chaque personnage et chaque épisode de ses livres (sauf ceux exclus), le nombre de
// mentions de ses noms, en mot entier. passages : [{ slug, book, text }] (le texte de l'épisode).
// Renvoie [{ character, passage, mentions }] (slugs), seulement là où le nom apparaît.
export function characterAppearances(characters, passages) {
  return characters.flatMap((character) => passages
    .filter((passage) => character.books.includes(passage.book) && !character.notIn.includes(passage.slug))
    .map((passage) => ({ character: character.slug, passage: passage.slug, mentions: countMentions(character, passage.text) }))
    .filter((appearance) => appearance.mentions > 0));
}

// Mot entier : pas de lettre juste avant ni juste après (« Marie » n'est pas trouvé dans « Mariette »)
function countMentions(character, text) {
  return character.searchNames
    .map((name) => text.match(new RegExp(`(?<!\\p{L})${name}(?!\\p{L})`, 'gu'))?.length ?? 0)
    .reduce((sum, count) => sum + count, 0);
}
