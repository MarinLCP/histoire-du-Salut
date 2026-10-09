// Un lien vers un parallèle qui retient où revenir (bouton « Revenir à … ») : il ajoute le verset de départ
// (returnTo) en haut de la pile des retours (voir bible/returnPoint.js), sans effacer ceux d'avant. On peut ainsi
// suivre plusieurs parallèles de suite, puis revenir pas à pas jusqu'à la toute première lecture.
// Les autres props (to, className, onClick...) vont au lien.

import { Link, useLocation } from 'react-router';
import { withReturn } from '../bible/returnPoint.js';

function ReturnLink({ returnTo, ...linkProps }) {
  const { state } = useLocation();
  return <Link {...linkProps} state={withReturn(state, returnTo)} />;
}

export default ReturnLink;
