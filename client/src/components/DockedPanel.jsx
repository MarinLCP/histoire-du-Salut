// Un panneau fixé à droite de la lecture (écran large) : la lecture continue à côté, sans fond grisé.
// Un titre, un bouton « Fermer » (ou Échap), puis son contenu. Sur un écran plus étroit, la même chose
// s'affiche en SidePanel (par-dessus la lecture). Utilisé par le panneau des parallèles.

import { useEffect, useId } from 'react';
import './DockedPanel.css';

function DockedPanel({ title, onClose, children }) {
  const titleId = useId();
  useCloseOnEscape(onClose);

  return (
    <aside className="docked-panel" aria-labelledby={titleId}>
      <header className="side-panel-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="side-panel-close" onClick={onClose}>Fermer</button>
      </header>
      {children}
    </aside>
  );
}

// Échap referme le panneau. Sauf si une fenêtre est ouverte par-dessus (ex. le menu d'un verset) :
// Échap ne referme alors qu'elle (le navigateur s'en charge)
function useCloseOnEscape(onClose) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
}

export default DockedPanel;
