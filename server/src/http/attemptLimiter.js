// Limite les essais de mot de passe : après `maxFailures` échecs en `windowMs` pour un même e-mail, on refuse
// d'essayer pendant le reste de la fenêtre (deviner un mot de passe en essayant tout devient impossible).
// Par e-mail plutôt que par adresse IP : derrière l'hébergeur, l'IP d'origine se falsifie facilement.
// En mémoire : suffisant pour un seul serveur (remis à zéro à chaque redémarrage). Au-delà de MAX_KEYS
// e-mails retenus, les échecs trop anciens sont oubliés : des essais sur des millions d'adresses
// différentes ne font pas grossir la mémoire du serveur sans fin.

const MAX_KEYS = 10000;

/**
 * @param {{ maxFailures: number, windowMs: number, now?: () => number }} settings - now : l'horloge (remplaçable en test)
 */
export function createAttemptLimiter({ maxFailures, windowMs, now = Date.now }) {
  // clé -> dates des échecs récents
  const failures = new Map();
  const recentFailures = (key) => (failures.get(key) ?? []).filter((time) => now() - time < windowMs);

  return {
    isBlocked: (key) => recentFailures(key).length >= maxFailures,
    recordFailure(key) {
      if (failures.size >= MAX_KEYS) forgetOldFailures(failures, recentFailures);
      failures.set(key, [...recentFailures(key), now()]);
    },
    reset(key) {
      failures.delete(key);
    },
  };
}

function forgetOldFailures(failures, recentFailures) {
  for (const key of failures.keys()) {
    if (recentFailures(key).length === 0) failures.delete(key);
  }
}
