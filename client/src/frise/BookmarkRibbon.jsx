// Le ruban du marque-page : il dépasse du bloc de la frise où le lecteur l'a posé (menu d'un verset). Un clic
// y ramène la lecture ; le ruban reste, jusqu'à ce que le lecteur retire le marque-page.

import { RibbonIcon } from './RibbonIcon.jsx';

export function BookmarkRibbon({ left, top, title, onOpen }) {
  return (
    <button type="button" className="frise-bookmark" style={{ left, top }} onClick={onOpen}
      aria-label={`Aller au marque-page : ${title}`} title="Aller au marque-page">
      <RibbonIcon />
    </button>
  );
}
