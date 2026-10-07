// Le ruban du marque-page : il dépasse du bloc de la frise où le marque-page est (où on s'était arrêté à la
// visite précédente, ou là où le lecteur l'a posé). Un clic y ramène la lecture ; ensuite, le ruban d'un
// marque-page qui suit la lecture disparaît, celui d'un marque-page posé à la main reste (voir useBookmark).

import { RibbonIcon } from './RibbonIcon.jsx';

export function BookmarkRibbon({ left, top, title, onResume }) {
  return (
    <button type="button" className="frise-bookmark" style={{ left, top }} onClick={onResume}
      aria-label={`Reprendre la lecture là où tu t'étais arrêté : ${title}`} title="Reprendre la lecture ici">
      <RibbonIcon />
    </button>
  );
}
