// Références bibliques : le SEUL endroit qui sait les écrire. Fonctions pures, faciles à tester.

// "Gn 1,3" : la référence d'un verset. Sert aussi de clé stable pour les surlignages et les notes
// (elle reste la même si la base ou la traduction change).
export function verseKey(bookCode, verse) {
  return `${bookCode} ${verse.chapter},${verse.verse}`;
}

// "La Genèse 12, 1-9" ou, sur deux chapitres, "La Genèse 1, 1 – 2, 25"
export function passageReference({ book, start, end }) {
  if (start.chapter === end.chapter) {
    return `${book.title} ${start.chapter}, ${start.verse}-${end.verse}`;
  }
  return `${book.title} ${start.chapter}, ${start.verse} – ${end.chapter}, ${end.verse}`;
}
