// Installer l'application (V12.4) : ce que le navigateur permet.
// - Android, Chrome et Edge sur ordinateur : le navigateur propose lui-même d'installer (événement
//   « beforeinstallprompt »). On le garde de côté dès le chargement du site (il arrive tôt, parfois avant React),
//   et notre bouton l'ouvre ;
// - iPhone et iPad : pas de bouton possible, Apple ne le permet pas : on explique les gestes (Partager, puis « Sur
//   l'écran d'accueil ») ;
// - déjà installée (l'app est ouverte en plein écran, depuis son icône) : rien à proposer.

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Pas la petite barre automatique du navigateur : c'est notre bouton qui proposera, au bon moment
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

// Pour useSyncExternalStore (useInstall.js) : prévenir React quand l'installation devient possible
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const canPrompt = () => deferredPrompt !== null;

// Ouvre la fenêtre d'installation du navigateur ; renvoie vrai si le lecteur a accepté
export async function promptInstall() {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  notify();
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome === 'accepted';
}

// L'app est-elle ouverte depuis son icône (installée) ? navigator.standalone : le vieux nom chez Apple
export function isInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches === true || navigator.standalone === true;
}

// Un iPhone ou un iPad (l'iPad se présente comme un Mac, mais il a un écran tactile)
export function isAppleMobile() {
  const { userAgent, maxTouchPoints } = navigator;
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}
