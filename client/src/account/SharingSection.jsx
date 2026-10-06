// « Partager où j'en suis » (dans « Mon compte », une fois connecté) : un lien à envoyer. Celui qui l'ouvre voit
// l'épisode et le chapitre où on en est (et le prénom donné par Google, s'il y en a un), sans compte ; jamais
// l'e-mail ni les notes. « Arrêter de partager » : le lien ne mène plus nulle part.

import { useState } from 'react';
import { useSharing } from './useSharing.js';
import { progressLink } from '../share/shareLink.js';
import { shareUrl } from '../share/share.js';

const SHARE_TITLE = 'Où j\'en suis dans L\'histoire d\'un Salut';
const SHARE_MESSAGES = { shared: 'Lien partagé.', copied: 'Lien copié : colle-le dans un message.', cancelled: null };

function SharingSection() {
  const { sharing, error, openShare, closeShare } = useSharing();
  const [message, setMessage] = useState(null);

  if (error) return <p role="alert">{error}</p>;
  if (!sharing) return null;

  // Chaque action affiche son résultat, ou son erreur
  const report = (action) => action().then(setMessage, (actionError) => setMessage(actionError.message));
  const share = () => report(async () => {
    const token = sharing.token ?? await openShare();
    const url = progressLink(globalThis.location.origin, token);
    return SHARE_MESSAGES[await shareUrl({ title: SHARE_TITLE, url })];
  });
  const stopSharing = () => report(() => closeShare().then(() => 'Le lien ne mène plus nulle part.'));

  return (
    <div className="account-sharing">
      <h4>Partager où j'en suis</h4>
      <div className="settings-actions">
        <button type="button" onClick={share}>{sharing.token ? 'Partager à nouveau' : 'Partager où j\'en suis'}</button>
        {sharing.token && <button type="button" onClick={stopSharing}>Arrêter de partager</button>}
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

export default SharingSection;
