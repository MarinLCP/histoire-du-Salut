// « Revenir à Ps 78,9 » : après un clic sur un parallèle, un bouton qui flotte en bas de la lecture ramène au verset
// de départ, dans sa lecture (la Bible entière ou l'épisode). Les parallèles ouverts à la suite ont laissé une pile
// d'endroits où revenir dans l'état de la navigation (location.state.returnStack, voir bible/returnPoint.js) :
// le bouton ramène au dernier, et le suivant prend sa place, jusqu'à la toute première lecture. Au retour, la
// lecture défile jusqu'au verset (state.scrollToVerse).

import { useLocation, useNavigate } from 'react-router';
import { returnStackOf } from '../bible/returnPoint.js';
import './ReturnButton.css';

function ReturnButton() {
  const stack = returnStackOf(useLocation().state);
  const navigate = useNavigate();
  const returnTo = stack.at(-1);
  if (!returnTo) return null;

  function goBack() {
    navigate(returnTo.href, { state: { scrollToVerse: returnTo.key, returnStack: stack.slice(0, -1) } });
  }

  return (
    <button type="button" className="return-button" onClick={goBack}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      Revenir à {returnTo.key}
    </button>
  );
}

export default ReturnButton;
