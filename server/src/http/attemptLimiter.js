// Limite les essais pour un même e-mail : après `maxAttempts` essais en `windowMs`, on refuse pendant le reste
// de la fenêtre. Sert à la connexion (deviner un mot de passe en essayant tout devient impossible ; une réussite
// remet le compteur à zéro) et au renvoi d'un code de validation (pas de pluie d'e-mails).
// Par e-mail plutôt que par adresse IP : derrière l'hébergeur, l'IP d'origine se falsifie facilement.
// En mémoire : suffisant pour un seul serveur (remis à zéro à chaque redémarrage). Au-delà de MAX_KEYS
// e-mails retenus, les essais trop anciens sont oubliés : des essais sur des millions d'adresses
// différentes ne font pas grossir la mémoire du serveur sans fin.

const MAX_KEYS = 10000;

/**
 * @param {{ maxAttempts: number, windowMs: number, now?: () => number }} settings - now : l'horloge (remplaçable en test)
 */
export function createAttemptLimiter({ maxAttempts, windowMs, now = Date.now }) {
  // clé -> dates des essais récents
  const attempts = new Map();
  const recentAttempts = (key) => (attempts.get(key) ?? []).filter((time) => now() - time < windowMs);

  return {
    isBlocked: (key) => recentAttempts(key).length >= maxAttempts,
    recordAttempt(key) {
      if (attempts.size >= MAX_KEYS) forgetOldAttempts(attempts, recentAttempts);
      attempts.set(key, [...recentAttempts(key), now()]);
    },
    reset(key) {
      attempts.delete(key);
    },
  };
}

function forgetOldAttempts(attempts, recentAttempts) {
  for (const key of attempts.keys()) {
    if (recentAttempts(key).length === 0) attempts.delete(key);
  }
}
