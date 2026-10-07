// La navigation, qui flotte au-dessus de la page (pas de bandeau) : à gauche la marque du site, au centre
// un lien par lecture (NavLink ajoute aria-current="page" sur celle affichée), à droite le bouton
// « personne » qui ouvre le panneau du compte et des réglages.
// `pages` : [{ to, label }] (la liste est dans App.jsx) ; onOpenSettings : ouvrir ce panneau.

import { NavLink } from 'react-router';
import './NavBar.css';

function NavBar({ pages, onOpenSettings }) {
  return (
    <header className="nav-bar">
      <a className="nav-brand" href="/" aria-label="L'histoire d'un Salut, accueil">
        <img src="/favicon.svg" alt="" width="28" height="28" />
        <span>L'histoire d'un Salut</span>
      </a>
      <nav className="nav-pages" aria-label="Pages">
        {pages.map((page) => (
          // end : "/" n'est la page en cours que pour l'adresse "/" exactement (pas pour "/bible")
          <NavLink key={page.to} to={page.to} end className="nav-link">
            {page.label}
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
