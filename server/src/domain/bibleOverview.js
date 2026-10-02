// L'arbre « Bible entière » de la frise : grands ensembles → livres → (dizaines) → chapitres.
// Fonction pure : elle reçoit les listes à plat du repository (déjà dans l'ordre) et les imbrique.

import { leafNode, parentNode } from './overviewNode.js';

// Au-delà de 15 chapitres, un niveau par dizaines : sinon l'escalier de la frise devient illisible
const GROUP_BY_TENS_ABOVE = 15;
const TENS = 10;

/**
 * @param {import('./BibleRepository.js').BibleOutline} outline
 * @returns {import('./overviewNode.js').OverviewNode[]}
 */
export function buildBibleTree({ groups, books, chapters }) {
  const chaptersByBook = Map.groupBy(chapters, (chapter) => chapter.book);
  // Le seed garantit qu'il n'y a pas de trou ; si la base est modifiée à la main, la frise s'adapte au lieu
  // d'échouer : un livre sans chapitre, puis un ensemble sans livre, sont sautés
  const booksByGroup = Map.groupBy(books.filter((book) => chaptersByBook.has(book.code)), (book) => book.group);

  return groups.filter((group) => booksByGroup.has(group.slug)).map((group) => parentNode({
    title: group.title,
    icon: group.icon,
    children: booksByGroup.get(group.slug).map((book) => bookNode(book, chaptersByBook.get(book.code))),
  }));
}

function bookNode(book, chapters) {
  const chapterNodes = chapters.map((chapter) => leafNode({ title: `Chapitre ${chapter.label}`, icon: 'page', position: chapter.position }));
  const children = chapters.length > GROUP_BY_TENS_ABOVE ? splitIntoTens(chapters, chapterNodes) : chapterNodes;
  return parentNode({ title: book.title, icon: 'book', children });
}

// Dix chapitres par dizaine, dans l'ordre (par rang, pas par numéro : les Psaumes ont "9A", "9B")
function splitIntoTens(chapters, chapterNodes) {
  const tens = [];
  for (let start = 0; start < chapters.length; start += TENS) {
    const labels = chapters.slice(start, start + TENS).map((chapter) => chapter.label);
    tens.push(parentNode({ title: tensTitle(labels), icon: 'pages', children: chapterNodes.slice(start, start + TENS) }));
  }
  return tens;
}

// "Chapitres 1-10", ou "Chapitre 21" quand la dernière dizaine n'a qu'un chapitre
function tensTitle(labels) {
  if (labels.length === 1) return `Chapitre ${labels[0]}`;
  return `Chapitres ${labels[0]}-${labels.at(-1)}`;
}
