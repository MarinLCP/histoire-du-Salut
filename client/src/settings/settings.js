// Les réglages de lecture (fonctions pures) : la taille du texte et le thème.
// Ils s'appliquent à la racine de la page : une échelle CSS pour le texte, un attribut data-theme pour le thème.

// Taille du texte -> échelle appliquée aux versets (voir VerseList.css)
const TEXT_SCALES = { small: 0.9, normal: 1, large: 1.15 };
// 'auto' suit le réglage du téléphone ou de l'ordinateur (clair le jour, sombre le soir...)
const THEMES = ['auto', 'light', 'dark'];

export const DEFAULT_SETTINGS = { textSize: 'normal', theme: 'auto' };

// Des réglages enregistrés (peut-être anciens ou abîmés) -> des réglages valides
export function withDefaults(stored) {
  return {
    textSize: stored.textSize in TEXT_SCALES ? stored.textSize : DEFAULT_SETTINGS.textSize,
    theme: THEMES.includes(stored.theme) ? stored.theme : DEFAULT_SETTINGS.theme,
  };
}

// root : la racine de la page (document.documentElement)
export function applySettings({ textSize, theme }, root) {
  root.style.setProperty('--reading-scale', String(TEXT_SCALES[textSize]));
  if (theme === 'auto') {
    root.removeAttribute('data-theme');
    return;
  }
  root.setAttribute('data-theme', theme);
}
