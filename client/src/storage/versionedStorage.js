// Sauvegarde d'une Map dans le navigateur (localStorage), au format versionné :
// { "version": 1, "<nom>": { clé: valeur, ... } }.
// Utilisé par les surlignages et les notes : le jour où ces données iront sur le serveur (V4.4),
// seuls les fichiers *.storage.js changeront.

export function createVersionedStorage(storageKey, formatVersion) {
  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      // Rien de sauvegardé (null) ou format inconnu : on repart de zéro
      if (stored?.version !== formatVersion) return new Map();
      return new Map(Object.entries(stored[storageKey]));
    } catch {
      // Données illisibles ou stockage bloqué (ex. navigation privée) : l'app continue sans
      return new Map();
    }
  }

  function save(entries) {
    const stored = { version: formatVersion, [storageKey]: Object.fromEntries(entries) };

    try {
      localStorage.setItem(storageKey, JSON.stringify(stored));
    } catch {
      // Stockage bloqué ou plein : les données restent en mémoire jusqu'à la fermeture de la page
    }
  }

  return { load, save };
}
