// Page « Bible entière » (adresse /bible) : toute la Bible, lue en continu, chapitre après chapitre.
// Depuis un lien (/bible?livre=Gn&chapitre=3, ex. « Lire tout le chapitre »), la lecture commence à ce chapitre.
// La suite se charge au fil du défilement (même mécanisme que la timeline : useCursorPagination).
// Cachée en ligne tant qu'elle n'est pas finie (feature flag "bible", voir App.jsx).

import { memo } from 'react';
import { Link, useLocation } from 'react-router';
import Chapter from '../components/Chapter.jsx';
import ListStatus from '../components/ListStatus.jsx';
import { fetchBible, fetchChapter } from '../api/bible.api.js';
import { readChapterLink } from '../bible/bibleLink.js';
import { useCursorPagination } from '../hooks/useCursorPagination.js';
import { useStartCursor } from '../hooks/useStartCursor.js';
import './BiblePage.css';

// Fonctions stables (hors des composants) : les hooks ne se relancent pas à chaque affichage
const fetchChapters = (after) => fetchBible(after).then((page) => ({ items: page.chapters, nextCursor: page.nextCursor }));

// search : l'adresse du lien (?livre=Gn&chapitre=3), déjà reconnue par readChapterLink
function findChapterPosition(search) {
  const { book, chapter } = readChapterLink(search);
  return fetchChapter(book, chapter).then((found) => found.position);
}

// annotations : surlignages, notes et ouverture du menu d'un verset (partagés par toutes les pages)
function BiblePage({ annotations }) {
  const { search } = useLocation();

  return (
    <section aria-labelledby="bible-page-title">
      <h1 className="bible-page-title" id="bible-page-title">La Bible entière</h1>
      {/* key : une autre adresse (autre lien, ou retour au début) = une lecture recommencée de zéro */}
      <BibleReading key={search} search={search} annotations={annotations} />
    </section>
  );
}

// Où commencer (au début, ou au chapitre du lien), puis la lecture
function BibleReading({ search, annotations }) {
  const linkKey = readChapterLink(search) ? search : null;
  const startAfter = useStartCursor(linkKey, findChapterPosition);

  if (startAfter === null) return <ListStatus isLoading />;
  return <BibleReader startAfter={startAfter} annotations={annotations} />;
}

function BibleReader({ startAfter, annotations }) {
  const { items: chapters, sentinelRef, isLoading, error, isFinished, retry } =
    useCursorPagination(fetchChapters, startAfter);

  return (
    <>
      {startAfter > 0 && (
        <Link className="list-back" to="/bible">
          ↑ Revenir au début de la Bible
        </Link>
      )}
      {chapters.map((chapter, index) => (
        <Chapter
          key={chapter.position}
          chapter={chapter}
          showBookTitle={startsNewBook(chapters, index)}
          annotations={annotations}
        />
      ))}
      <ListStatus isLoading={isLoading} error={error} isFinished={isFinished} onRetry={retry}
        finishedText="Tu as lu toute la Bible." />
      <div ref={sentinelRef} aria-hidden="true" />
    </>
  );
}

// Le premier chapitre d'un livre dans la liste : on y affiche le titre du livre
function startsNewBook(chapters, index) {
  return index === 0 || chapters[index - 1].book.code !== chapters[index].book.code;
}

// memo : ouvrir ou fermer le menu d'un verset (dans App) ne redessine pas toute la Bible
export default memo(BiblePage);
