// La barre de navigation : un lien par page. NavLink ajoute aria-current="page" sur la page affichée.
// `pages` : [{ to, label }] (App décide quelles pages existent, selon les feature flags).

import { NavLink } from 'react-router';
import './NavBar.css';

function NavBar({ pages }) {
  return (
    <nav className="nav-bar" aria-label="Pages">
      {pages.map((page) => (
        // end : "/" n'est la page en cours que pour l'adresse "/" exactement (pas pour "/bible")
        <NavLink key={page.to} to={page.to} end className="nav-link">
          {page.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default NavBar;
