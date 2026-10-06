// Liens vers un chapitre ou un verset de la Bible entière : fonctions pures, faciles à tester.
// Format : /bible?livre=Gn&chapitre=3, et pour un verset : /bible?livre=Gn&chapitre=3&verset=15

const BOOK = 'livre';
const CHAPTER = 'chapitre';
const VERSE = 'verset';

export function chapterLink(bookCode, chapter) {
  const search = new URLSearchParams({ [BOOK]: bookCode, [CHAPTER]: chapter });
  return `/bible?${search}`;
}

// Lien vers un verset (ex. un parallèle) : la lecture commence à son chapitre, puis va jusqu'au verset
export function verseLink({ book, chapter, verse }) {
  const search = new URLSearchParams({ [BOOK]: book, [CHAPTER]: chapter, [VERSE]: verse });
  return `/bible?${search}`;
}

// search : la partie "?..." de l'adresse. Renvoie { book, chapter, verse } (verse : null si le lien vise
// tout le chapitre), ou null s'il manque le livre ou le chapitre.
export function readChapterLink(search) {
  const parameters = new URLSearchParams(search);
  const book = parameters.get(BOOK);
  const chapter = parameters.get(CHAPTER);
  if (!book || !chapter) return null;
  return { book, chapter, verse: parameters.get(VERSE) || null };
}
