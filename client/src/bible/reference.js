// Références bibliques : le SEUL endroit qui sait les écrire. Fonctions pures, faciles à tester.

// "Gn 1,3" : la référence d'un verset. Sert aussi de clé stable pour les surlignages et les notes
// (elle reste la même si la base ou la traduction change).
export function verseKey(bookCode, verse) {
  return `${bookCode} ${verse.chapter},${verse.verse}`;
}

// L'inverse de verseKey : "Gn 1,3" -> { book: 'Gn', chapter: '1', verse: '3' } (null si ce n'en est pas une)
export function parseVerseKey(key) {
  const match = /^(\S+) ([^,]+),(.+)$/.exec(key);
  if (!match) return null;
  const [, book, chapter, verse] = match;
  return { book, chapter, verse };
}

// Un verset ou une plage, avec les codes des livres (parallèles) : "Ml 3,23", "Mc 9,11-13",
// "Gn 31,55 – 32,2", ou, d'un livre au suivant, "2Ch 36,22 – Esd 1,3"
export function rangeReference(start, end) {
  const first = verseKey(start.book, start);
  if (start.book !== end.book) return `${first} – ${verseKey(end.book, end)}`;
  if (start.chapter !== end.chapter) return `${first} – ${end.chapter},${end.verse}`;
  if (start.verse !== end.verse) return `${first}-${end.verse}`;
  return first;
}

// "La Genèse 12, 1-9" ou, sur deux chapitres, "La Genèse 1, 1 – 2, 25"
export function passageReference({ book, start, end }) {
  if (start.chapter === end.chapter) {
    return `${book.title} ${start.chapter}, ${start.verse}-${end.verse}`;
  }
  return `${book.title} ${start.chapter}, ${start.verse} – ${end.chapter}, ${end.verse}`;
}
