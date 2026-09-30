// Bouton "Partager" d'un passage. Son libellé confirme quand le lien a été copié (ou si ça a échoué).
// onShare() renvoie une promesse : 'shared', 'copied' ou 'cancelled' (voir share/share.js).

import { useState } from 'react';

const LABELS = {
  idle: 'Partager',
  copied: 'Lien copié ✓',
  failed: 'Partage impossible',
};

function ShareButton({ onShare }) {
  const [status, setStatus] = useState('idle');

  function share() {
    onShare()
      // Après la feuille de partage du téléphone (ou si on l'a fermée), rien à confirmer
      .then((result) => setStatus(result === 'copied' ? 'copied' : 'idle'))
      .catch(() => setStatus('failed'));
  }

  return (
    <button className="share-button" onClick={share}>
      {LABELS[status]}
    </button>
  );
}

export default ShareButton;
