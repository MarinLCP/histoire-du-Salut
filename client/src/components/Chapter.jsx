// Un chapitre de la Bible entière : le titre du livre (seulement au premier chapitre affiché du livre),
// le numéro du chapitre, puis ses versets.

import { memo } from 'react';
import VerseList from './VerseList.jsx';
import './Chapter.css';

// showBookTitle : vrai pour le premier chapitre d'un livre dans la liste
function Chapter({ chapter, showBookTitle, annotations }) {
  return (
    // data-reading-position : la frise repère ainsi le chapitre en cours de lecture (frise/useReadingPosition.js) ;
    // data-reading-title : le titre qui reste collé en haut pendant qu'on le lit (ReadingTitle.jsx)
    <article className="chapter" data-reading-position={chapter.position}
      data-reading-title={`${chapter.book.title} · Chapitre ${chapter.chapter}`}>
      {showBookTitle && <h2 className="chapter-book">{chapter.book.title}</h2>}
      <h3 className="chapter-title">Chapitre {chapter.chapter}</h3>
      <VerseList verses={chapter.verses} bookCode={chapter.book.code} annotations={annotations} />
    </article>
  );
}

// memo : un chapitre déjà affiché ne se redessine pas quand la suite se charge
export default memo(Chapter);
