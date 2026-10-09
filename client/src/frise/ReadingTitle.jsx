// Le titre de ce qu'on lit (livre et chapitre, ou épisode), dans une pastille qui flotte en bas de la lecture
// pendant le défilement (placée par ReadingWithFrise, à côté du bouton « Frise » sur téléphone). Caché tant que
// le vrai titre est à l'écran. Le titre vient de l'élément lu (data-reading-title, posé par Chapter et Passage).
// Trop long pour la pastille, il finit par « … » : un toucher dessus l'affiche en entier, un autre le replie.

import { useState } from 'react';
import { readingTitleAt } from './readingPosition.js';
import './ReadingTitle.css';

// readingAt : où en est la lecture (mesuré par ReadingWithFrise)
function ReadingTitle({ readingAt }) {
  const title = readingTitleAt(readingAt);
  // Le titre déplié : un autre titre (la lecture a avancé) arrive replié, sans effet à écrire
  const [unfoldedTitle, setUnfoldedTitle] = useState(null);
  const isUnfolded = Boolean(title) && unfoldedTitle === title;

  const className = ['reading-title', title && 'visible', isUnfolded && 'unfolded'].filter(Boolean).join(' ');
  // Caché (le vrai titre est à l'écran) : ni le clavier ni le lecteur d'écran ne le trouvent
  return (
    <button type="button" className={className} aria-expanded={isUnfolded} aria-hidden={!title}
      tabIndex={title ? 0 : -1} onClick={() => setUnfoldedTitle(isUnfolded ? null : title)}>
      {title}
    </button>
  );
}

export default ReadingTitle;
