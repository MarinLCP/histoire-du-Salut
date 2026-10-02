// La mise en page des pages de lecture : la frise à gauche, la lecture à droite.
// - Écran large : les deux côte à côte.
// - Écran étroit (moins de 1100 px) : pas la place ; la frise est rangée dans un panneau glissant,
//   ouvert par l'onglet « Frise » au bord gauche, et refermé par Échap, un toucher dans la lecture,
//   ou un saut de lecture (un clic sur un bloc).

import { useCallback, useEffect, useState } from 'react';
import Frise from './Frise.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import './ReadingWithFrise.css';

// La même limite que dans ReadingWithFrise.css
const NARROW_SCREEN = '(max-width: 1099px)';

// mode, tabNames, onJump : transmis à la frise (voir Frise.jsx) ; children : la lecture
function ReadingWithFrise({ mode, tabNames, onJump, children }) {
  const isNarrow = useMediaQuery(NARROW_SCREEN);
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  // Après un saut, on veut voir le texte : le panneau se referme
  const jumpAndClose = useCallback((position) => {
    onJump(position);
    setIsOpen(false);
  }, [onJump]);

  useCloseOnEscape(isOpen, setIsOpen);

  return (
    <div className="with-frise">
      {/* inert : panneau fermé sur écran étroit = ni clavier ni lecteur d'écran n'y entrent */}
      <div id="frise-drawer" className={`frise-drawer${isOpen ? ' open' : ''}`} inert={isNarrow && !isOpen}>
        <Frise mode={mode} tabNames={tabNames} onJump={jumpAndClose} />
      </div>
      <button type="button" className="frise-drawer-tab" aria-controls="frise-drawer" aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}>
        Frise
      </button>
      <div className="with-frise-reading" onClick={isOpen ? close : undefined}>{children}</div>
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
