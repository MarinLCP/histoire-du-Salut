// Value object : un mot de passe choisi par un lecteur, avant d'être haché. Immuable et toujours acceptable
// (vérification dès la création, "fail fast") : entre 10 et 128 caractères. Pas de règle « une majuscule,
// un chiffre... » : la longueur protège mieux et se retient plus facilement (recommandations de l'ANSSI).
// Il ne s'affiche jamais par erreur : converti en texte (message, journal, JSON), il devient « [mot de passe] ».

import { ValidationError } from './errors.js';

const MIN_LENGTH = 10;
// Au-delà, hacher le mot de passe coûterait cher au serveur pour rien
const MAX_LENGTH = 128;
const HIDDEN = '[mot de passe]';

export class Password {
  /** @param {unknown} text */
  constructor(text) {
    if (typeof text !== 'string' || text.length < MIN_LENGTH || text.length > MAX_LENGTH) {
      throw new ValidationError(`Le mot de passe doit faire entre ${MIN_LENGTH} et ${MAX_LENGTH} caractères.`);
    }
    this.value = text;
    Object.freeze(this);
  }

  toString() {
    return HIDDEN;
  }

  toJSON() {
    return HIDDEN;
  }
}
