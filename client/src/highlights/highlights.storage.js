// Sauvegarde des surlignages dans le navigateur (localStorage).
// Le reste de l'app ne connaît que loadHighlights / saveHighlights : le jour où les surlignages
// iront sur le serveur (V4.4), seul ce fichier changera.

const STORAGE_KEY = 'highlights';
// À incrémenter si le format change, pour pouvoir transformer les anciennes données
const FORMAT_VERSION = 1;

export function loadHighlights() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Rien de sauvegardé (null) ou format inconnu : on repart de zéro
    if (stored?.version !== FORMAT_VERSION) return new Map();
    return new Map(Object.entries(stored.highlights));
  } catch {
    // Données illisibles ou stockage bloqué (ex. navigation privée) : l'app continue sans
    return new Map();
  }
}

export function saveHighlights(highlights) {
  const stored = { version: FORMAT_VERSION, highlights: Object.fromEntries(highlights) };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Stockage bloqué ou plein : les surlignages restent en mémoire jusqu'à la fermeture de la page
  }
}
