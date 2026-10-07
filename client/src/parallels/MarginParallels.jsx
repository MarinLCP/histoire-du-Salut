// Les parallèles d'un verset dans la marge (comme une page de la Bible de Jérusalem) : ses références les plus
// votées, chacune un lien vers le verset. Sur grand écran, à droite du texte ; plus étroit, sous le verset.

import { Link } from 'react-router';
import { rangeReference } from '../bible/reference.js';
import { verseLink } from '../bible/bibleLink.js';
import './MarginParallels.css';

// parallels : [{ start, end }] ; returnTo : où revenir ensuite, { key: "Ps 78,9", href } (bouton « Revenir à … »)
function MarginParallels({ parallels, returnTo }) {
  return (
    <ul className="margin-parallels" aria-label={`Parallèles de ${returnTo.key}`}>
      {parallels.map(({ start, end }) => {
        const reference = rangeReference(start, end);
        return (
          <li key={reference}>
            <Link to={verseLink(start)} state={{ returnTo }}>{reference}</Link>
          </li>
        );
      })}
    </ul>
  );
}

export default MarginParallels;
