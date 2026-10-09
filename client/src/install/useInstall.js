// Hook React : peut-on proposer d'installer l'application, et comment (voir installPrompt.js) ?
// - way : 'installed' (rien à proposer), 'button' (le navigateur peut installer : notre bouton), 'apple'
//   (iPhone, iPad : les gestes à expliquer) ou 'menu' (un autre navigateur : passer par son menu) ;
// - install() : ouvre la fenêtre d'installation du navigateur (way === 'button').

import { useSyncExternalStore } from 'react';
import { canPrompt, isAppleMobile, isInstalled, promptInstall, subscribe } from './installPrompt.js';

export function useInstall() {
  const browserCanInstall = useSyncExternalStore(subscribe, canPrompt);
  return { way: installWay(browserCanInstall), install: promptInstall };
}

function installWay(browserCanInstall) {
  if (isInstalled()) return 'installed';
  if (browserCanInstall) return 'button';
  return isAppleMobile() ? 'apple' : 'menu';
}
