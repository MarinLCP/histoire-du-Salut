// Le prénom montré à d'autres (sur un lien « Partager où j'en suis ») : il vient de Google, on ne le montre
// qu'une fois nettoyé. Sans caractères de contrôle, sans espaces autour, 30 caractères au plus ; null s'il
// ne reste rien.

const MAX_LENGTH = 30;

/** @param {unknown} text @returns {string | null} */
export function publicName(text) {
  if (typeof text !== 'string') return null;
  // \p{Cc} : les caractères de contrôle (retours à la ligne, tabulations, caractères invisibles...)
  const cleaned = text.replace(/\p{Cc}/gu, '').trim().slice(0, MAX_LENGTH).trim();
  return cleaned === '' ? null : cleaned;
}
