// « L'application » dans le panneau « Compte et réglages » : mettre le site sur l'écran d'accueil (InstallHelp).
// Rien si l'app est déjà installée.

import InstallHelp from './InstallHelp.jsx';
import { useInstall } from './useInstall.js';

function InstallSection() {
  const { way } = useInstall();
  if (way === 'installed') return null;

  return (
    <section className="settings-section" aria-labelledby="install-title">
      <h3 id="install-title">L'application</h3>
      <p>Sur l'écran d'accueil, elle s'ouvre comme une app, en plein écran, et se relit même sans réseau.</p>
      <InstallHelp />
    </section>
  );
}

export default InstallSection;
