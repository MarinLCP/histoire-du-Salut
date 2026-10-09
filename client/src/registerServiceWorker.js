// Enregistre le service worker de l'application (public/sw.js, V12.3) : l'app se rouvre et se relit sans
// réseau. Seulement le site construit (npm run build) : en développement, Vite sert les fichiers autrement et
// une copie gardée gênerait. Sans service worker (vieux navigateur), le site marche comme avant.

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  // Après le chargement : la page s'affiche d'abord, le service worker s'installe ensuite
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
