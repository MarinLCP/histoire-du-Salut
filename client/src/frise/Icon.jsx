// Un pictogramme au trait de la frise, dessiné en SVG avec la couleur du texte (currentColor) :
// il suit le thème clair / sombre. Les dessins sont dans iconDrawings.jsx.

import { ICONS } from './iconDrawings.jsx';

// Un nom inconnu affiche la page (jamais un trou) ; le test icons.test.js vérifie qu'aucun nom ne manque
export function Icon({ name }) {
  return (
    <svg className="frise-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] ?? ICONS.page}
    </svg>
  );
}
