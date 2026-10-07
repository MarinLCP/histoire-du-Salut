// « Marque-page » sous le verset où le lecteur l'a posé (le même ruban que dans la frise). Aussi montré, en
// exemple, sur la carte d'accueil « Tes notes et surlignages ».

import { RibbonIcon } from '../frise/RibbonIcon.jsx';
import './BookmarkTag.css';

function BookmarkTag() {
  return (
    <p className="verse-bookmark">
      <RibbonIcon />
      Marque-page
    </p>
  );
}

export default BookmarkTag;
