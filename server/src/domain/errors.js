// Erreurs métier : elles disent CE QUI ne va pas, sans rien savoir de HTTP.
// C'est la couche http/ (errorHandler.js) qui les traduit en 400 ou 404.

// Une demande mal formée (ex. limit=1000)
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Ce qui est demandé n'existe pas (ex. un passage inconnu)
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Il faut être connecté, ou les identifiants sont faux (ex. mot de passe incorrect)
export class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Ce qui est demandé entre en conflit avec ce qui existe (ex. un compte existe déjà avec cet e-mail)
export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}
