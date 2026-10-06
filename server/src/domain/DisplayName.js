// Value object : le pseudo d'un lecteur, affiché quand il partage où il en est (jamais son e-mail).
// Immuable et toujours acceptable (vérification dès la création, "fail fast") : 2 à 30 caractères, sans
// espaces autour, sans caractères invisibles ni chevrons (il est affiché à d'autres lecteurs).

import { ValidationError } from './errors.js';

const MIN_LENGTH = 2;
const MAX_LENGTH = 30;
// Caractères de contrôle (retours à la ligne, tabulations...) et chevrons
const FORBIDDEN = /[\u0000-\u001f\u007f<>]/;

export class DisplayName {
  /** @param {unknown} text */
  constructor(text) {
    const value = typeof text === 'string' ? text.trim() : '';
    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH || FORBIDDEN.test(value)) {
      throw new ValidationError(`Le pseudo fait entre ${MIN_LENGTH} et ${MAX_LENGTH} caractères, sans < ni >.`);
    }
    this.value = value;
    Object.freeze(this);
  }
}
