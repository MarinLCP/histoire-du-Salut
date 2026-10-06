// Erreurs métier : elles disent CE QUI ne va pas, sans rien savoir de HTTP.
// C'est la couche http/ (errorHandler.js) qui les traduit en 400, 401, 404, 409 ou 503.

// La base commune : chaque erreur porte le nom de sa classe (ex. « ValidationError »)
class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = new.target.name;
  }
}

// Une demande mal formée (ex. limit=1000)
export class ValidationError extends DomainError {}

// Il faut être connecté, ou les identifiants sont faux (ex. mot de passe incorrect)
export class UnauthorizedError extends DomainError {}

// Ce qui est demandé n'existe pas (ex. un passage inconnu)
export class NotFoundError extends DomainError {}

// Ce qui est demandé entre en conflit avec ce qui existe (ex. un compte existe déjà avec cet e-mail)
export class ConflictError extends DomainError {}

// Ce qui est demandé n'est pas possible pour le moment (ex. envoyer un e-mail tant qu'aucun service n'est branché)
export class UnavailableError extends DomainError {}
