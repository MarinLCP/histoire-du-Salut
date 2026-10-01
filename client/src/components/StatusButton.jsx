// Un bouton dont le libellé confirme le résultat de son action (ex. "Verset copié ✓", "Partage impossible").
// action() renvoie une promesse du statut à afficher ensuite : 'idle' (libellé de départ) ou 'done'.
// Si l'action échoue, le bouton affiche le libellé 'failed'.
// Utilisé par "Copier le verset" (menu d'un verset) et "Partager" (en-tête d'un passage).

import { useState } from 'react';

/**
 * @param {object} props
 * @param {{ idle: string, done: string, failed: string }} props.labels
 * @param {() => Promise<'idle' | 'done'>} props.action
 * @param {string} [props.className]
 */
function StatusButton({ labels, action, className }) {
  const [status, setStatus] = useState('idle');

  function run() {
    action()
      .then(setStatus)
      .catch(() => setStatus('failed'));
  }

  return (
    <button className={className} onClick={run}>
      {/* Statut inattendu (action mal branchée) : le libellé de départ, jamais un bouton vide */}
      {labels[status] ?? labels.idle}
    </button>
  );
}

export default StatusButton;
