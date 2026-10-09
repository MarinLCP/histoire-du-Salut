// « Revenir à Ps 78,9 » : après un clic sur un parallèle, une pastille qui flotte en bas de la lecture ramène au
// verset de départ, dans sa lecture (la Bible entière ou l'épisode). Les parallèles ouverts à la suite ont laissé
// une pile d'endroits où revenir (useReturnStack) : le bouton ramène au dernier, et le suivant prend sa place,
// jusqu'à la toute première lecture. Au retour, la lecture défile jusqu'au verset (state.scrollToVerse).
// La croix, à droite : rester ici (la pile est abandonnée, la pastille disparaît). Un saut dans la frise fait
// de même (ReadingWithFrise).

import { useNavigate } from 'react-router';
import { useReturnStack } from '../bible/useReturnStack.js';
import './ReturnButton.css';

function ReturnButton() {
  const { stack, dismiss } = useReturnStack();
  const navigate = useNavigate();
  const returnTo = stack.at(-1);
  if (!returnTo) return null;

  function goBack() {
    navigate(returnTo.href, { state: { scrollToVerse: returnTo.key, returnStack: stack.slice(0, -1) } });
  }

  return (
    <div className="return-pill">
      <button type="button" className="return-button" onClick={goBack}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        Revenir à {returnTo.key}
      </button>
      <button type="button" className="return-dismiss" onClick={dismiss} aria-label="Rester ici" title="Rester ici">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}

export default ReturnButton;
