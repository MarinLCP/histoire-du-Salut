// La mise en page des pages de lecture : la frise à gauche, la lecture à droite (écran large).
// Sans le flag "frise" (en ligne, tant qu'elle n'est pas finie) : la lecture seule, comme avant.

import { hasFeature } from '../features/features.js';
import './ReadingWithFrise.css';

// frise : l'élément <Frise .../> à afficher ; children : la lecture (timeline, Bible entière)
function ReadingWithFrise({ frise, children }) {
  if (!hasFeature('frise')) return children;

  return (
    <div className="with-frise">
      {frise}
      <div className="with-frise-reading">{children}</div>
    </div>
  );
}

export default ReadingWithFrise;
