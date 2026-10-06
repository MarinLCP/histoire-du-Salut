// Un panneau qui glisse depuis le bord droit, par-dessus la lecture (fond grisé derrière) : un titre,
// un bouton « Fermer », puis son contenu. Une fenêtre <dialog> modale (useModalDialog) : Échap ou un
// toucher sur le fond le referment. Utilisé par le panneau Paramètres et par celui des parallèles.

import { useId } from 'react';
import { useModalDialog } from '../hooks/useModalDialog.js';
import './SidePanel.css';

function SidePanel({ title, onClose, children }) {
  const { dialogRef, backdropProps } = useModalDialog(onClose);
  const titleId = useId();

  return (
    <dialog ref={dialogRef} className="side-panel" onClose={onClose} aria-labelledby={titleId} {...backdropProps}>
      <div className="side-panel-content">
        <header className="side-panel-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="side-panel-close" onClick={onClose}>Fermer</button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export default SidePanel;
