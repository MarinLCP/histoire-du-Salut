// Value object : l'adresse e-mail d'un compte. Rangée en minuscules et sans espaces autour
// (« Marin@Exemple.fr » et « marin@exemple.fr » sont le même lecteur). Immuable et toujours bien formée
// (vérification dès la création, "fail fast"). Le format vérifié reste simple : une adresse se prouve
// vraiment en recevant un e-mail, pas avec une expression régulière.

import { ValidationError } from './errors.js';

const FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// La longueur maximale d'une adresse e-mail (norme RFC 5321)
const MAX_LENGTH = 254;

export class Email {
  /** @param {unknown} text */
  constructor(text) {
    const value = Email.normalize(text);
    if (value.length > MAX_LENGTH || !FORMAT.test(value)) throw new ValidationError('Adresse e-mail invalide.');
    this.value = value;
    Object.freeze(this);
  }

  // La forme rangée d'une adresse (minuscules, sans espaces autour), même mal formée : sert aussi de clé
  // à la limite d'essais de connexion (http/accountRoutes.js)
  /** @param {unknown} text @returns {string} */
  static normalize(text) {
    return typeof text === 'string' ? text.trim().toLowerCase() : '';
  }
}
