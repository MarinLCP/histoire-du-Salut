// La sauvegarde des notes et surlignages (fonctions pures) : un fichier JSON à télécharger, puis à réimporter
// (sur un autre appareil, ou après avoir vidé le navigateur). En attendant les comptes (Phase 11).
// Format (version 1) : { format, version, exportedAt, highlights: { "Gn 1,3": {...} }, notes: { ... } }

const FORMAT = 'histoire-du-salut';
const VERSION = 1;

// highlights, notes : les Map de l'app ; exportedAt : la date de l'export (texte ISO)
export function createBackup({ highlights, notes }, exportedAt) {
  return {
    format: FORMAT,
    version: VERSION,
    exportedAt,
    highlights: Object.fromEntries(highlights),
    notes: Object.fromEntries(notes),
  };
}

// Le texte d'un fichier -> { highlights, notes } (des Map), ou une erreur au message clair
export function readBackup(text) {
  const backup = parseJson(text);
  if (backup?.format !== FORMAT || typeof backup.highlights !== 'object' || typeof backup.notes !== 'object') {
    throw new Error('Ce fichier n\'est pas une sauvegarde de L\'histoire d\'un Salut.');
  }
  if (backup.version > VERSION) throw new Error('Cette sauvegarde vient d\'une version plus récente de l\'app.');
  return { highlights: new Map(Object.entries(backup.highlights)), notes: new Map(Object.entries(backup.notes)) };
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Ajoute ce qui est importé à ce qu'on a déjà ; en cas de doublon, le fichier importé gagne
export function mergeInto(current, imported) {
  return new Map([...current, ...imported]);
}

// ex. "histoire-du-salut-sauvegarde-2026-10-06.json"
export function backupFileName(date) {
  return `${FORMAT}-sauvegarde-${date.toISOString().slice(0, 10)}.json`;
}
