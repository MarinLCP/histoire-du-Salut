// « Partager où j'en suis » (dans « Mon compte », une fois connecté) : un pseudo (jamais l'e-mail), puis un
// lien à envoyer. Celui qui l'ouvre voit l'épisode et le chapitre où on en est, sans compte ; jamais les notes.
// « Arrêter de partager » : le lien ne mène plus nulle part.

import { useState } from 'react';
import { useSharing } from './useSharing.js';
import { progressLink } from '../share/shareLink.js';
import { shareUrl } from '../share/share.js';

const SHARE_TITLE = 'Où j\'en suis dans L\'histoire d\'un Salut';
const SHARE_MESSAGES = { shared: 'Lien partagé.', copied: 'Lien copié : colle-le dans un message.', cancelled: null };

function SharingSection() {
  const { sharing, error, saveDisplayName, openShare, closeShare } = useSharing();
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
      <DisplayNameLine displayName={sharing.displayName} onSave={saveDisplayName} />
      {sharing.displayName && (
        <div className="settings-actions">
          <button type="button" onClick={share}>{sharing.token ? 'Partager à nouveau' : 'Partager où j\'en suis'}</button>
          {sharing.token && <button type="button" onClick={stopSharing}>Arrêter de partager</button>}
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}

// Le pseudo : son nom et « Modifier », ou le formulaire (s'il n'y en a pas encore, ou pour le modifier)
function DisplayNameLine({ displayName, onSave }) {
  const [isEditing, setIsEditing] = useState(false);

  if (displayName && !isEditing) {
    return (
      <p>
        Ton pseudo : <strong>{displayName}</strong>{' '}
        <button type="button" className="account-link" onClick={() => setIsEditing(true)}>Modifier</button>
      </p>
    );
  }
  return <DisplayNameForm current={displayName} onSave={(name) => onSave(name).then(() => setIsEditing(false))} />;
}

// Le pseudo affiché sur le lien (2 à 30 caractères)
function DisplayNameForm({ current, onSave }) {
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    try {
      await onSave(new FormData(event.currentTarget).get('displayName'));
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <label>
        Ton pseudo (affiché sur le lien, jamais ton e-mail)
        <input name="displayName" defaultValue={current ?? ''} minLength={2} maxLength={30} required />
      </label>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit">Enregistrer le pseudo</button>
    </form>
  );
}

export default SharingSection;
