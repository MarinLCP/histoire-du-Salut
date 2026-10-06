// Le ruban du marque-page : il dépasse du bloc de la frise où on s'était arrêté à la visite précédente.
// Un clic y ramène la lecture (puis le ruban disparaît : voir useBookmark).

export function BookmarkRibbon({ left, top, title, onResume }) {
  return (
    <button type="button" className="frise-bookmark" style={{ left, top }} onClick={onResume}
      aria-label={`Reprendre la lecture là où tu t'étais arrêté : ${title}`} title="Reprendre la lecture ici">
      <svg viewBox="0 0 16 26" aria-hidden="true">
        <path d="M1 0h14v24l-7-6-7 6z" />
      </svg>
    </button>
  );
}
