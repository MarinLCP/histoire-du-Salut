// L'astuce de l'appui long (V11.4) : le geste le plus caché du site, montré une seule fois, après les cartes
// d'accueil. Une petite bulle qui flotte sous la navigation, sans bloquer la lecture ; « Compris » la retire
// (ouvrir le menu d'un verset aussi : voir App.jsx).

import { TOUCH_SCREEN, useMediaQuery } from '../hooks/useMediaQuery.js';
import './LongPressHint.css';

function LongPressHint({ onDismiss }) {
  const isTouch = useMediaQuery(TOUCH_SCREEN);

  return (
    <aside className="long-press-hint" aria-label="Astuce">
      <p>
        <strong>Astuce :</strong> {isTouch ? 'appui long' : 'clic droit'} sur un verset pour le surligner, écrire une
        note ou poser le marque-page.
      </p>
      <button type="button" className="button-primary" onClick={onDismiss}>Compris</button>
    </aside>
  );
}

export default LongPressHint;
