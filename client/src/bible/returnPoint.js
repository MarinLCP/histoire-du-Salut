// Où revenir après un clic sur un parallèle (marge ou panneau) : le verset de départ et l'adresse de sa lecture.
// Fonction pure. key : "Ps 78,9" ; reference : { book, chapter, verse } ;
// returnHref : l'adresse de la lecture de départ si ce n'est pas la Bible entière (ex. l'épisode "/?passage=chute")

import { verseLink } from './bibleLink.js';

export function returnPoint(key, reference, returnHref) {
  return { key, href: returnHref ?? verseLink(reference) };
}
