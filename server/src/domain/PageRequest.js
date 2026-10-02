// Value object : "quelle page ?" = les `limit` éléments après la position `after` (passages de la timeline,
// chapitres de la Bible...).
// Immuable et toujours valide : les règles de pagination vivent ici, pas dans les routes HTTP.

import { ValidationError } from './errors.js';

const DEFAULT_AFTER = 0;
const DEFAULT_LIMIT = 5;
// Une limite maximale évite qu'un client demande toute la base d'un coup
const MAX_LIMIT = 20;

export class PageRequest {
  /** @param {number} after @param {number} limit @param {number} [maxLimit] */
  constructor(after, limit, maxLimit = MAX_LIMIT) {
    if (!Number.isInteger(after) || after < 0) {
      throw new ValidationError('`after` doit être un entier positif ou nul.');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
      throw new ValidationError(`\`limit\` doit être un entier entre 1 et ${maxLimit}.`);
    }
    this.after = after;
    this.limit = limit;
    Object.freeze(this);
  }

  // Depuis des paramètres reçus en texte (ex. ?after=3&limit=5). Absents : valeurs par défaut.
  // `limits` permet d'autres réglages selon ce qu'on pagine (ex. la Bible : 2 chapitres, 5 au plus).
  /**
   * @param {{ after?: string, limit?: string }} query
   * @param {{ defaultLimit?: number, maxLimit?: number }} [limits]
   * @returns {PageRequest}
   */
  static from({ after, limit }, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
    return new PageRequest(Number(after ?? DEFAULT_AFTER), Number(limit ?? defaultLimit), maxLimit);
  }
}

// Le curseur de la page suivante : la position du dernier élément de cette page, ou null s'il ne reste rien.
// Partagé par toutes les listes paginées (timeline, Bible entière).
/** @param {{ position: number }[]} items @param {boolean} hasMore @returns {number | null} */
export function nextCursorOf(items, hasMore) {
  return hasMore ? items.at(-1).position : null;
}
