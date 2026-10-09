// Où revenir après un clic sur un parallèle (marge ou panneau) : le verset de départ et l'adresse de sa lecture.
// Fonctions pures. key : "Ps 78,9" ; reference : { book, chapter, verse } ;
// returnHref : l'adresse de la lecture de départ si ce n'est pas la Bible entière (ex. l'épisode "/?passage=chute")

import { verseLink } from './bibleLink.js';

export function returnPoint(key, reference, returnHref) {
  return { key, href: returnHref ?? verseLink(reference) };
}

// La pile des retours, gardée dans l'état de la navigation (location.state.returnStack) : chaque parallèle ouvert
// y ajoute son verset de départ ; « Revenir à … » ramène au dernier et le retire. state : location.state
export function returnStackOf(state) {
  return state?.returnStack ?? [];
}

// L'état de navigation d'un lien vers un parallèle : la pile actuelle, plus returnTo en haut
export function withReturn(state, returnTo) {
  return { returnStack: [...returnStackOf(state), returnTo] };
}
