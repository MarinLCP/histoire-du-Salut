import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.jsx';

// StrictMode : en dev, React lance certains effets deux fois pour débusquer les bugs.
// BrowserRouter : relie les pages aux adresses du navigateur (/, /bible...) et aux boutons Précédent / Suivant.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
