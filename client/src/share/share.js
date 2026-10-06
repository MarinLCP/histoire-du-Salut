// Partager un lien : la feuille de partage du téléphone si elle existe, sinon copie du lien.
// Renvoie 'shared' (partagé), 'copied' (lien copié) ou 'cancelled' (l'utilisateur a renoncé).
// Sert à partager un passage, et à partager où on en est (lien de progression).

import { passageLink } from './shareLink.js';
import { copyText } from '../copy/clipboard.js';

// copy est remplaçable dans les tests ; en vrai, on prend celui du navigateur
export async function shareUrl({ title, url }, { copy = copyText } = {}) {
  // navigator.share n'existe que sur mobile (surtout), et seulement en HTTPS ou sur localhost
  if (!globalThis.isSecureContext || !navigator.share) {
    await copy(url);
    return 'copied';
  }

  try {
    await navigator.share({ title, url });
    return 'shared';
  } catch (error) {
    // Fermer la feuille de partage sans choisir d'application n'est pas une erreur
    if (error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}

// origin et copy sont remplaçables dans les tests ; en vrai, on prend ceux du navigateur
export function sharePassage(passage, { origin = globalThis.location?.origin, copy = copyText } = {}) {
  return shareUrl({ title: passage.title, url: passageLink(origin, passage.slug) }, { copy });
}
