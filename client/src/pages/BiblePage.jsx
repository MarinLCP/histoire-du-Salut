// Page « Bible entière » (adresse /bible) : toute la Bible, lue en continu, chapitre après chapitre.
// La suite se charge au fil du défilement (même mécanisme que la timeline : useCursorPagination).
// Cachée en ligne tant qu'elle n'est pas finie (feature flag "bible", voir App.jsx).

import { memo } from 'react';
import Chapter from '../components/Chapter.jsx';
import ListStatus from '../components/ListStatus.jsx';
import { fetchBible } from '../api/bible.api.js';
import { useCursorPagination } from '../hooks/useCursorPagination.js';
import './BiblePage.css';

const START_OF_BIBLE = 0;

// Fonction stable (hors du composant) : le hook ne se relance pas à chaque affichage
const fetchChapters = (after) => fetchBible(after).then((page) => ({ items: page.chapters, nextCursor: page.nextCursor }));

// annotations : surlignages, notes et ouverture du menu d'un verset (partagés par toutes les pages)
function BiblePage({ annotations }) {
  const { items: chapters, sentinelRef, isLoading, error, isFinished, retry } =
    useCursorPagination(fetchChapters, START_OF_BIBLE);

  return (
    <section aria-labelledby="bible-page-title">
      <h1 className="bible-page-title" id="bible-page-title">La Bible entière</h1>
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
    </section>
  );
}

// Le premier chapitre d'un livre dans la liste : on y affiche le titre du livre
function startsNewBook(chapters, index) {
  return index === 0 || chapters[index - 1].book.code !== chapters[index].book.code;
}

// memo : ouvrir ou fermer le menu d'un verset (dans App) ne redessine pas toute la Bible
export default memo(BiblePage);
