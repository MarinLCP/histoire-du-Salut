// Liens vers un chapitre de la Bible entière : fonctions pures, faciles à tester.
// Format : /bible?livre=Gn&chapitre=3

const BOOK = 'livre';
const CHAPTER = 'chapitre';

export function chapterLink(bookCode, chapter) {
  const search = new URLSearchParams({ [BOOK]: bookCode, [CHAPTER]: chapter });
  return `/bible?${search}`;
}

// search : la partie "?..." de l'adresse. Renvoie { book, chapter }, ou null s'il manque l'un des deux.
export function readChapterLink(search) {
  const parameters = new URLSearchParams(search);
  const book = parameters.get(BOOK);
  const chapter = parameters.get(CHAPTER);
  if (!book || !chapter) return null;
  return { book, chapter };
}
