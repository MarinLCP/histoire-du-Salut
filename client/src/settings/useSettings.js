// Hook React : les réglages de lecture, appliqués à la page et sauvegardés dans le navigateur à chaque changement.
// (Ils sont aussi appliqués avant le premier affichage, dans main.jsx, pour éviter un éclair du mauvais thème.)

import { useCallback, useEffect, useState } from 'react';
import { applySettings } from './settings.js';
import { loadSettings, saveSettings } from './settings.storage.js';

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    applySettings(settings, document.documentElement);
    saveSettings(settings);
  }, [settings]);

  // changes : les réglages modifiés (ex. { theme: 'dark' })
  const change = useCallback((changes) => setSettings((current) => ({ ...current, ...changes })), []);
  return { settings, change };
}
