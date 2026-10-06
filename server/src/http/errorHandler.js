// Middleware d'erreurs : traduit les erreurs métier du domaine en codes HTTP (400, 401, 404, 409), en UN seul endroit.
// Express le reconnaît à ses 4 paramètres ; Express 5 lui envoie aussi les erreurs des routes async.

import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../domain/errors.js';

const STATUS_BY_ERROR = [
  [ValidationError, 400],
  [UnauthorizedError, 401],
  [NotFoundError, 404],
  [ConflictError, 409],
];

export function errorHandler(error, req, res, next) {
  // instanceof : une future sous-classe (ex. une erreur plus précise que NotFoundError) garde son code
  const match = STATUS_BY_ERROR.find(([ErrorClass]) => error instanceof ErrorClass);

  // Erreur inattendue (base injoignable, bug...) : Express renvoie une 500 et l'écrit dans les logs
  if (!match) return next(error);

  res.status(match[1]).json({ error: error.message });
}
