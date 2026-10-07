// Un panneau fixé à droite de la lecture (écran large) : la lecture continue à côté, sans fond grisé.
// Un titre, un bouton « Fermer » (ou Échap), puis son contenu. Sur un écran plus étroit, la même chose
// s'affiche en SidePanel (par-dessus la lecture). Utilisé par le panneau des parallèles.

import { useId } from 'react';
import { useCloseOnEscape } from '../hooks/useCloseOnEscape.js';
// Le titre et le bouton « Fermer » ont le style de SidePanel (side-panel-header, side-panel-close)
import './SidePanel.css';
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

export default DockedPanel;
