// La section « Mes notes et surlignages » du panneau Paramètres : les télécharger dans un fichier,
// ou importer un fichier (sur un autre appareil, ou après avoir vidé le navigateur).
// onDownload(fileName, backup) : fait télécharger le fichier (injecté par App : downloadJson) ;
// onImport({ highlights, notes }) : ajoute ce qui a été importé.

import { useState } from 'react';
import { createBackup, readBackup, backupFileName } from './backup.js';

function BackupSection({ highlights, notes, onDownload, onImport }) {
  // Le résultat du dernier import, affiché sous les boutons (ou null)
  const [message, setMessage] = useState(null);

  function download() {
    const now = new Date();
    onDownload(backupFileName(now), createBackup({ highlights, notes }, now.toISOString()));
  }

  async function importFile(event) {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const backup = readBackup(await file.text());
      onImport(backup);
      setMessage(`Importé : ${counted(backup.highlights.size, backup.notes.size)}.`);
    } catch (error) {
      setMessage(error.message);
    }
    // Le même fichier pourra être choisi à nouveau
    event.target.value = '';
  }

  return (
    <section className="settings-backup" aria-labelledby="backup-title">
      <h3 id="backup-title">Mes notes et surlignages</h3>
      <p>{counted(highlights.size, notes.size)}</p>
      <div className="settings-backup-actions">
        <button type="button" onClick={download}>Télécharger une sauvegarde</button>
        <label className="settings-backup-import">
          Importer une sauvegarde
          <input type="file" accept="application/json,.json" onChange={importFile} />
        </label>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}

// "2 surlignages et 1 note"
function counted(highlightCount, noteCount) {
  return `${plural(highlightCount, 'surlignage')} et ${plural(noteCount, 'note')}`;
}

function plural(count, word) {
  return `${count} ${word}${count > 1 ? 's' : ''}`;
}

export default BackupSection;
