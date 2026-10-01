// Value object : "quelle page de la timeline ?" = les `limit` passages après la position `after`.
// Immuable et toujours valide : les règles de pagination vivent ici, pas dans les routes HTTP.

import { ValidationError } from './errors.js';

const DEFAULT_AFTER = 0;
const DEFAULT_LIMIT = 5;
// Une limite maximale évite qu'un client demande toute la base d'un coup
const MAX_LIMIT = 20;

export class PageRequest {
  /** @param {number} after @param {number} limit */
  constructor(after, limit) {
    if (!Number.isInteger(after) || after < 0) {
      throw new ValidationError('`after` doit être un entier positif ou nul.');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new ValidationError(`\`limit\` doit être un entier entre 1 et ${MAX_LIMIT}.`);
    }
    this.after = after;
    this.limit = limit;
    Object.freeze(this);
  }

  // Depuis des paramètres reçus en texte (ex. ?after=3&limit=5). Absents : valeurs par défaut.
  /** @param {{ after?: string, limit?: string }} query @returns {PageRequest} */
  static from({ after, limit }) {
    return new PageRequest(Number(after ?? DEFAULT_AFTER), Number(limit ?? DEFAULT_LIMIT));
  }
}
