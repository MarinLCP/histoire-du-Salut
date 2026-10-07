// « Revenir à Ps 78,9 » : après un clic sur un parallèle, un bouton qui flotte en bas de la lecture ramène au verset
// de départ, dans sa lecture (la Bible entière ou l'épisode). Le parallèle a laissé l'endroit où revenir dans
// l'état de la navigation (location.state.returnTo, voir bible/returnPoint.js) ; au retour, la lecture défile
// jusqu'au verset (state.scrollToVerse).

import { useLocation, useNavigate } from 'react-router';
import './ReturnButton.css';

function ReturnButton() {
  const returnTo = useLocation().state?.returnTo;
  const navigate = useNavigate();
  if (!returnTo) return null;

  return (
    <button type="button" className="return-button" onClick={() => navigate(returnTo.href, { state: { scrollToVerse: returnTo.key } })}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      Revenir à {returnTo.key}
    </button>
  );
}

export default ReturnButton;
