// Feature flags : cacher une fonctionnalité pas finie, tout en la commitant sur main (Trunk-Based Development).
// - En dev (npm run dev) : tout est visible, pour travailler dessus.
// - En ligne : seulement les fonctionnalités listées dans la variable Render VITE_FEATURES (ex. "frise,graphe").
// Usage dans un composant : {hasFeature('frise') && <Frise />}
// Une fois la fonctionnalité stable et en ligne pour tout le monde, on supprime son flag du code.

// Règle pure (testée) : on lui passe la situation au lieu de lire Vite
export function isFeatureEnabled(name, { isDev, enabledList }) {
  if (isDev) return true;
  return parseFeatureList(enabledList).includes(name);
}

// " frise , graphe " -> ["frise", "graphe"] ; absent ou vide -> []
function parseFeatureList(text = '') {
  return text
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean);
}

// Ce qu'utilisent les composants. Vite remplace import.meta.env.* AU MOMENT DU BUILD :
// changer VITE_FEATURES sur Render demande donc un nouveau déploiement.
// Tout ce qui commence par VITE_ finit dans le code envoyé au navigateur : jamais de secret dedans.
export function hasFeature(name) {
  return isFeatureEnabled(name, {
    isDev: import.meta.env.DEV,
    enabledList: import.meta.env.VITE_FEATURES,
  });
}
