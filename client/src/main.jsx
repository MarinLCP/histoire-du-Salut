import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.jsx';
import { applySettings } from './settings/settings.js';
import { loadSettings } from './settings/settings.storage.js';

// Les réglages (thème, taille du texte) avant le premier affichage : pas d'éclair du mauvais thème
applySettings(loadSettings(), document.documentElement);

// StrictMode : en dev, React lance certains effets deux fois pour débusquer les bugs.
// BrowserRouter : relie les pages aux adresses du navigateur (/, /bible...) et aux boutons Précédent / Suivant.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
