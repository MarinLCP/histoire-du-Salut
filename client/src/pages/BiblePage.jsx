// Page « Bible entière » (adresse /bible) : toute la Bible, lue en continu, chapitre après chapitre.
// Depuis un lien (/bible?livre=Gn&chapitre=3, ex. « Lire tout le chapitre »), la lecture commence à ce chapitre.
// La suite se charge au fil du défilement (même mécanisme que la timeline : useCursorPagination).
// Cachée en ligne tant qu'elle n'est pas finie (feature flag "bible", voir App.jsx).
// À gauche, la frise en mode Bible entière (cachée en ligne : flag "frise").

import { memo } from 'react';
import { Link, useLocation } from 'react-router';
import Chapter from '../components/Chapter.jsx';
import ListStatus from '../components/ListStatus.jsx';
import ReadingWithFrise from '../frise/ReadingWithFrise.jsx';
import { fetchBible, fetchChapter } from '../api/bible.api.js';
import { readChapterLink } from '../bible/bibleLink.js';
import { useCursorPagination } from '../hooks/useCursorPagination.js';
import { useStartCursor } from '../hooks/useStartCursor.js';
import { useJump } from '../frise/useJump.js';
import './BiblePage.css';

// Fonctions stables (hors des composants) : les hooks ne se relancent pas à chaque affichage
const fetchChapters = (after) => fetchBible(after).then((page) => ({ items: page.chapters, nextCursor: page.nextCursor }));

// search : l'adresse du lien (?livre=Gn&chapitre=3), déjà reconnue par readChapterLink
function findChapterPosition(search) {
  const { book, chapter } = readChapterLink(search);
  return fetchChapter(book, chapter).then((found) => found.position);
}

const TAB_NAMES = ["Vue d'ensemble", 'Livres', 'Chapitres'];

// annotations : surlignages, notes et ouverture du menu d'un verset (partagés par toutes les pages)
function BiblePage({ annotations }) {
  // location.key change à chaque navigation, même vers la même adresse (ex. « Revenir au début » depuis /bible)
  const { search, key: navigationKey } = useLocation();
  // Un clic dans la frise vers un chapitre pas encore chargé : la lecture recommence à ce chapitre
  const [jumpStart, jumpTo] = useJump(navigationKey);

  return (
    <ReadingWithFrise mode="bible" tabNames={TAB_NAMES} onJump={jumpTo}>
      <section aria-labelledby="bible-page-title">
        <h1 className="bible-page-title" id="bible-page-title">La Bible entière</h1>
        {/* key : une autre adresse (autre lien, ou retour au début) = une lecture recommencée de zéro */}
        <BibleReading key={search} search={search} jumpStart={jumpStart} annotations={annotations} />
      </section>
    </ReadingWithFrise>
  );
}

// Où commencer (au début, au chapitre du lien, ou au chapitre choisi dans la frise), puis la lecture
function BibleReading({ search, jumpStart, annotations }) {
  const linkKey = readChapterLink(search) ? search : null;
  const linkStart = useStartCursor(linkKey, findChapterPosition);
  const startAfter = jumpStart ?? linkStart;

  if (startAfter === null) return <ListStatus isLoading />;
  // key : un autre point de départ = une lecture rechargée depuis ce chapitre
  return <BibleReader key={startAfter} startAfter={startAfter} annotations={annotations} />;
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
