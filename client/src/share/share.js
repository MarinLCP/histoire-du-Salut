// Partage d'un passage : la feuille de partage du téléphone si elle existe, sinon copie du lien.
// Renvoie 'shared' (partagé), 'copied' (lien copié) ou 'cancelled' (l'utilisateur a renoncé).

import { passageLink } from './shareLink.js';
import { copyText } from '../copy/clipboard.js';

// origin et copy sont remplaçables dans les tests ; en vrai, on prend ceux du navigateur
export async function sharePassage(passage, { origin = globalThis.location?.origin, copy = copyText } = {}) {
  const url = passageLink(origin, passage.slug);

  // navigator.share n'existe que sur mobile (surtout), et seulement en HTTPS ou sur localhost
  if (!globalThis.isSecureContext || !navigator.share) {
    await copy(url);
    return 'copied';
  }

  try {
    await navigator.share({ title: passage.title, url });
    return 'shared';
  } catch (error) {
    // Fermer la feuille de partage sans choisir d'application n'est pas une erreur
    if (error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}
