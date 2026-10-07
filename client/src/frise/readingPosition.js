// Où en est la lecture, mesuré dans la page (passages de l'histoire du salut ou chapitres de la Bible).
// Chaque élément lu porte data-reading-position (sa position). La « ligne de lecture » est à 35 % de la hauteur
// de l'écran : on lit ce qui la traverse. Renvoie la position de lecture continue (ex. 12.4 = 40 % du n° 12),
// ou null s'il n'y a encore rien à lire.

const READING_LINE = 0.35;
const MAX_PROGRESS = 0.999; // jamais 1 : la position resterait dans cet élément, pas au début du suivant
// Arrondie au millième : moins de valeurs différentes pendant le défilement, donc moins d'affichages de la frise
const PRECISION = 1000;

export function measureReadingPosition() {
  const items = document.querySelectorAll('[data-reading-position]');
  if (items.length === 0) return null;

  const line = window.innerHeight * READING_LINE;
  const index = lastIndexAbove(items.length, (rank) => items[rank].getBoundingClientRect().top, line);
  const progress = progressThrough(items[index].getBoundingClientRect(), line);
  return Number(items[index].dataset.readingPosition) + progress;
}

// Recherche par dichotomie du dernier élément dont le haut est au-dessus de la ligne (le premier sinon).
// topOf(rang) ne mesure que les éléments visités : rapide même avec des centaines de chapitres chargés.
export function lastIndexAbove(count, topOf, line) {
  let low = 0;
  let high = count - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (topOf(middle) <= line) {
      low = middle;
      continue;
    }
    high = middle - 1;
  }
  return low;
}

// La part de l'élément ({ top, height }, en px) déjà passée au-dessus de la ligne de lecture
// (un élément sans hauteur, ex. pas encore mis en page : 0)
export function progressThrough({ top, height }, line) {
  if (!(height > 0)) return 0;
  const progress = Math.min(MAX_PROGRESS, Math.max(0, (line - top) / height));
  return Math.round(progress * PRECISION) / PRECISION;
}

// Saute (sans long défilement) à une position de lecture, avec un léger fondu : l'inverse de la mesure.
// 20.47 = à 47 % de la hauteur de l'élément n° 20 (ex. le début d'un chapitre dans un épisode).
// Il s'arrête sous la barre de navigation (scroll-margin-top, voir index.css).
// Renvoie false si l'élément n'est pas encore chargé dans la page.
export function jumpToReadingPosition(position) {
  const index = Math.floor(position);
  const target = document.querySelector(`[data-reading-position="${index}"]`);
  if (!target) return false;

  const box = target.getBoundingClientRect();
  const navigationMargin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const top = window.scrollY + box.top + (position - index) * box.height - navigationMargin;
  window.scrollTo({ top, behavior: 'instant' });
  target.parentElement.animate?.([{ opacity: 0.35 }, { opacity: 1 }], { duration: 250, easing: 'ease' });
  return true;
}

// Le titre de ce qu'on lit (data-reading-title), pour la pastille du bas (ReadingTitle) ; null tant que le haut de cet
// élément est encore à l'écran (son vrai titre se voit déjà), ou s'il n'y a rien à lire.
export function readingTitleAt(position) {
  if (position === null) return null;
  const item = document.querySelector(`[data-reading-position="${Math.floor(position)}"]`);
  if (!item || item.getBoundingClientRect().top > 0) return null;
  return item.dataset.readingTitle ?? null;
}

// La position de lecture d'un verset (data-verse="Gn 1,3") : son haut, dans son passage ou son chapitre
// (ex. 20.47 = à 47 % de la hauteur du n° 20) ; jumpToReadingPosition l'amène en haut de l'écran.
// null s'il n'est pas dans la page.
export function verseReadingPosition(key) {
  const verse = document.querySelector(`[data-verse="${key}"]`);
  const item = verse?.closest('[data-reading-position]');
  if (!item) return null;

  return Number(item.dataset.readingPosition) + progressThrough(item.getBoundingClientRect(), verse.getBoundingClientRect().top);
}
