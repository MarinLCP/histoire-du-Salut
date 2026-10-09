// Un lien vers un parallèle qui retient où revenir (bouton « Revenir à … ») : il ajoute le verset de départ
// (returnTo) en haut de la pile des retours (useReturnStack), sans effacer ceux d'avant. On peut ainsi suivre
// plusieurs parallèles de suite, puis revenir pas à pas jusqu'à la toute première lecture.
// Les autres props (to, className, onClick...) vont au lien.

import { Link } from 'react-router';
import { useReturnStack } from '../bible/useReturnStack.js';

function ReturnLink({ returnTo, ...linkProps }) {
  const { stack } = useReturnStack();
  return <Link {...linkProps} state={{ returnStack: [...stack, returnTo] }} />;
}

export default ReturnLink;
