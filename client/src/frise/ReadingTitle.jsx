// Le titre de ce qu'on lit (livre et chapitre, ou épisode), dans une pastille qui flotte en bas de la lecture
// pendant le défilement (placée par ReadingWithFrise, à côté du bouton « Frise » sur téléphone). Caché tant que
// le vrai titre est à l'écran. Le titre vient de l'élément lu (data-reading-title, posé par Chapter et Passage).

import { useReadingPosition } from './useReadingPosition.js';
import { readingTitleAt } from './readingPosition.js';
import './ReadingTitle.css';

function ReadingTitle() {
  const title = readingTitleAt(useReadingPosition());

  // aria-hidden : le vrai titre est déjà dans la page, le lecteur d'écran ne l'entend pas deux fois
  return <p className={title ? 'reading-title visible' : 'reading-title'} aria-hidden="true">{title}</p>;
}

export default ReadingTitle;
