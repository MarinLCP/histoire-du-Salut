// Value object : l'identifiant fixe d'un passage, utilisé dans les liens partagés (ex. "creation").
// Immuable et toujours bien formé : un PassageSlug mal formé ne peut pas exister
// (vérification dès la création, "fail fast"). Utilisé par l'API ET par le seed.

import { ValidationError } from './errors.js';

// Minuscules, chiffres et tirets simples : la même règle que le CHECK de la table passages
const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class PassageSlug {
  /** @param {string} value */
  constructor(value) {
    if (!PassageSlug.isValid(value)) {
      throw new ValidationError(`Slug "${value}" mal formé : minuscules, chiffres et tirets uniquement.`);
    }
    this.value = value;
    Object.freeze(this);
  }

  /** @param {unknown} value @returns {boolean} */
  static isValid(value) {
    return typeof value === 'string' && SLUG_FORMAT.test(value);
  }
}
