// La règle commune des identifiants du site : minuscules, chiffres et tirets simples (ex. "creation",
// "terre-promise", "sun"). Slugs des passages, des époques et des grands ensembles, noms des pictogrammes.
// La même règle que les CHECK des tables passages, epochs et bible_groups.

const IDENTIFIER_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** @param {unknown} value @returns {boolean} */
export function isIdentifier(value) {
  return typeof value === 'string' && IDENTIFIER_FORMAT.test(value);
}
