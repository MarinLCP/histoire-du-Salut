// Découpage de la Bible en grands ensembles (db/bible-groups.data.js) : chaque ensemble va d'un premier
// à un dernier livre. Fonction pure, appelée par le seed AVANT de toucher à la base.
// Règle : les ensembles se suivent sans trou ni chevauchement, et couvrent tous les livres.

import { validateSlugList } from './dataIdentifier.js';

// bookCodes : les codes des livres dans l'ordre de lecture (ex. ['Gn', 'Ex', ...])
// Renvoie une Map : code du livre -> slug de son ensemble. Lève une erreur au premier problème.
export function assignBookGroups(groups, bookCodes) {
  validateSlugList(groups, 'Ensemble');
  const groupOfBook = new Map();
  let nextIndex = 0; // le premier livre pas encore rangé dans un ensemble

  for (const group of groups) {
    const [start, end] = requireBookRange(group, bookCodes, nextIndex);
    bookCodes.slice(start, end + 1).forEach((code) => groupOfBook.set(code, group.slug));
    nextIndex = end + 1;
  }

  // Les ensembles partent du premier livre et se suivent : il suffit qu'ils aillent jusqu'au dernier
  if (nextIndex < bookCodes.length) throw new Error(`Livre ${bookCodes[nextIndex]} : dans aucun ensemble.`);
  return groupOfBook;
}

// La place [début, fin] de l'ensemble dans bookCodes : il doit commencer pile au livre suivant
function requireBookRange(group, bookCodes, nextIndex) {
  const where = `Ensemble "${group.title}"`;
  const start = requireBookIndex(where, group.firstBook, bookCodes);
  const end = requireBookIndex(where, group.lastBook, bookCodes);

  if (start !== nextIndex) {
    throw new Error(`${where} : commence à ${group.firstBook}, mais le livre suivant est ${bookCodes[nextIndex]}.`);
  }
  if (end < start) throw new Error(`${where} : ${group.lastBook} est avant ${group.firstBook}.`);
  return [start, end];
}

function requireBookIndex(where, code, bookCodes) {
  const index = bookCodes.indexOf(code);
  if (index === -1) throw new Error(`${where} : livre ${code} introuvable.`);
  return index;
}
