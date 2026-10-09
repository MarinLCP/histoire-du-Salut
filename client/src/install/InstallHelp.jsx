// Comment installer l'application, selon le téléphone ou le navigateur (useInstall.js) : un bouton, ou les gestes
// expliqués. Montré dans la 4e carte d'accueil et dans « Compte et réglages ». Rien si l'app est déjà installée.

import { useInstall } from './useInstall.js';
import './InstallHelp.css';

function InstallHelp() {
  const { way, install } = useInstall();

  if (way === 'installed') return null;
  if (way === 'button') {
    return <button type="button" className="button-primary install-button" onClick={install}>Installer l'application</button>;
  }
  if (way === 'apple') {
    return (
      <ol className="install-steps">
        <li>
          Touche <strong>Partager</strong>
          {/* L'icône Partager de Safari : un carré ouvert, une flèche vers le haut */}
          <svg className="install-share" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1" /></svg>
          (en bas de Safari, ou en haut sur iPad) ;
        </li>
        <li>puis <strong>Sur l'écran d'accueil</strong>.</li>
      </ol>
    );
  }
  return (
    <p className="install-steps">
      Dans le menu de ton navigateur : <strong>Installer</strong> ou <strong>Ajouter à l'écran d'accueil</strong>.
    </p>
  );
}

export default InstallHelp;
