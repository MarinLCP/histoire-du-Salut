// La barre de navigation : un lien par lecture (NavLink ajoute aria-current="page" sur celle affichée),
// et à droite, le bouton qui ouvre les Paramètres.
// `pages` : [{ to, label }] (la liste est dans App.jsx) ; onOpenSettings : ouvrir le panneau Paramètres.

import { NavLink } from 'react-router';
import './NavBar.css';

function NavBar({ pages, onOpenSettings }) {
  return (
    <nav className="nav-bar" aria-label="Pages">
      {pages.map((page) => (
        // end : "/" n'est la page en cours que pour l'adresse "/" exactement (pas pour "/bible")
        <NavLink key={page.to} to={page.to} end className="nav-link">
          {page.label}
        </NavLink>
      ))}
      <button type="button" className="settings-button" aria-label="Paramètres" title="Paramètres" onClick={onOpenSettings}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </svg>
      </button>
    </nav>
  );
}

export default NavBar;
