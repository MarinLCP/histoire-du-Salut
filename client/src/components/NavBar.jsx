// La navigation, qui flotte au-dessus de la page (pas de bandeau ni de logo : l'icône est dans l'onglet) :
// au centre un lien par lecture (NavLink ajoute aria-current="page" sur celle affichée), à droite le bouton
// « personne » qui ouvre le panneau du compte et des réglages.
// `pages` : [{ to, label, shortLabel }] (la liste est dans App.jsx ; shortLabel : sur un très petit écran) ;
// onOpenSettings : ouvrir ce panneau.

import { NavLink } from 'react-router';
import './NavBar.css';

function NavBar({ pages, onOpenSettings }) {
  return (
    <header className="nav-bar">
      <nav className="nav-pages pill-tabs" aria-label="Pages">
        {pages.map((page) => (
          // end : "/" n'est la page en cours que pour l'adresse "/" exactement (pas pour "/bible")
          // aria-label : le nom complet, quel que soit le libellé affiché
          <NavLink key={page.to} to={page.to} end className="nav-link pill-tab" aria-label={page.label}>
            <span className="nav-label" aria-hidden="true">{page.label}</span>
            <span className="nav-label-short" aria-hidden="true">{page.shortLabel}</span>
          </NavLink>
        ))}
      </nav>
      <button type="button" className="nav-account" aria-label="Mon compte" title="Mon compte et réglages" onClick={onOpenSettings}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      </button>
    </header>
  );
}

export default NavBar;
