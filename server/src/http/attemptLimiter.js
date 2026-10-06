// Limite les essais de mot de passe : après `maxFailures` échecs en `windowMs` pour un même e-mail, on refuse
// d'essayer pendant le reste de la fenêtre (deviner un mot de passe en essayant tout devient impossible).
// Par e-mail plutôt que par adresse IP : derrière l'hébergeur, l'IP d'origine se falsifie facilement.
// En mémoire : suffisant pour un seul serveur (remis à zéro à chaque redémarrage).

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
      failures.set(key, [...recentFailures(key), now()]);
    },
    reset(key) {
      failures.delete(key);
    },
  };
}
