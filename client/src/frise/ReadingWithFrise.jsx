// La mise en page des pages de lecture : la frise à gauche, la lecture à droite.
// - Écran large : les deux côte à côte.
// - Écran étroit (moins de 1100 px) : pas la place ; la frise est rangée dans un panneau glissant
//   (2/3 de l'écran), ouvert par le bouton « Frise » (en bas à gauche). Il reste ouvert pendant qu'on zoome
//   et qu'on saute d'un bloc à l'autre ; un toucher dans la lecture (le tiers visible) ou Échap le referme.
// En bas de la lecture flottent le titre de ce qu'on lit et, après un clic sur un parallèle, « Revenir à … ».

import { useEffect, useState } from 'react';
import Frise from './Frise.jsx';
import ReadingTitle from './ReadingTitle.jsx';
import ReturnButton from '../components/ReturnButton.jsx';
import { ReadingModeContext } from './ReadingModeContext.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import './ReadingWithFrise.css';

// La même limite que dans ReadingWithFrise.css
const NARROW_SCREEN = '(max-width: 1099px)';

// mode, tabNames, onJump : transmis à la frise (voir Frise.jsx) ; children : la lecture (mode : ReadingModeContext)
function ReadingWithFrise({ mode, tabNames, onJump, children }) {
  const isNarrow = useMediaQuery(NARROW_SCREEN);
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  useCloseOnEscape(isOpen, setIsOpen);

  return (
    <div className="with-frise">
      {/* inert : panneau fermé sur écran étroit = ni clavier ni lecteur d'écran n'y entrent */}
      <div id="frise-drawer" className={`frise-drawer${isOpen ? ' open' : ''}`} inert={isNarrow && !isOpen}>
        <Frise mode={mode} tabNames={tabNames} onJump={onJump} />
      </div>
      <button type="button" className="frise-drawer-tab" aria-controls="frise-drawer" aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}>
        {/* L'escalier de la cascade */}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h7v5h5v5h6v4H3z" /></svg>
        Frise
      </button>
      <div className="with-frise-reading" onClick={isOpen ? close : undefined}>
        {/* Les versets savent à quelle lecture ils appartiennent (leur marque-page) */}
        {/* with-frise-content : la largeur de la lecture, que mesurent les versets (marge des parallèles) */}
        <ReadingModeContext.Provider value={mode}>
          <div className="with-frise-content">{children}</div>
        </ReadingModeContext.Provider>
        <div className="reading-bottom">
          <ReturnButton />
          <ReadingTitle />
        </div>
      </div>
    </div>
  );
}

// Échap referme le panneau (seulement quand il est ouvert). setIsOpen : le setter de React, toujours le même
function useCloseOnEscape(isOpen, setIsOpen) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setIsOpen]);
}

export default ReadingWithFrise;
