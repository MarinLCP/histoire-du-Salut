// Où en est la lecture, mesuré dans la page (passages de l'histoire du salut ou chapitres de la Bible).
// Chaque élément lu porte data-reading-position (sa position). La « ligne de lecture » est à 35 % de la hauteur
// de l'écran : on lit ce qui la traverse. Renvoie la position de lecture continue (ex. 12.4 = 40 % du n° 12),
// ou null s'il n'y a encore rien à lire.

const READING_LINE = 0.35;
const SCROLL_MARGIN = 12; // un peu d'air au-dessus du titre après un saut

export function measureReadingPosition() {
  const items = document.querySelectorAll('[data-reading-position]');
  if (items.length === 0) return null;

  const line = window.innerHeight * READING_LINE;
  const index = lastIndexAbove(items, line);
  const box = items[index].getBoundingClientRect();
  const progress = Math.min(0.999, Math.max(0, (line - box.top) / box.height));
  return Number(items[index].dataset.readingPosition) + Math.round(progress * 1000) / 1000;
}

// Recherche par dichotomie du dernier élément dont le haut est au-dessus de la ligne (le premier sinon) :
// rapide même avec des centaines de chapitres chargés
function lastIndexAbove(items, line) {
  let low = 0;
  let high = items.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (items[middle].getBoundingClientRect().top <= line) low = middle;
    else high = middle - 1;
  }
  return low;
}

// Saute (sans long défilement) à l'élément de cette position, avec un léger fondu.
// Renvoie false s'il n'est pas encore chargé dans la page.
export function jumpToReadingPosition(position) {
  const target = document.querySelector(`[data-reading-position="${position}"]`);
  if (!target) return false;

  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - SCROLL_MARGIN, behavior: 'instant' });
  target.parentElement.animate?.([{ opacity: 0.35 }, { opacity: 1 }], { duration: 250, easing: 'ease' });
  return true;
}
