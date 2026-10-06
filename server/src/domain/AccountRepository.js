// Ports (contrats) des comptes : ce dont les use cases ont besoin, sans dire COMMENT.
// Les implémentations sont dans infrastructure/ (PostgreSQL pour les comptes et les sessions, scrypt pour
// le hachage) ; les tests utilisent de faux objets en mémoire qui respectent les mêmes contrats.

/**
 * @typedef {object} User
 * @property {number} id
 * @property {string} email
 */

/**
 * @typedef {User & { passwordHash: string, emailVerifiedAt: string | null }} StoredUser
 *   - emailVerifiedAt : quand l'e-mail a été validé (null : pas encore, pas de session possible)
 */

/**
 * @typedef {object} UserRepository
 * @property {(email: import('./Email.js').Email, passwordHash: string) => Promise<User | null>} create
 *   - crée le compte, pas encore validé ; null si un compte existe déjà avec cet e-mail
 * @property {(email: import('./Email.js').Email) => Promise<StoredUser | null>} findByEmail
 * @property {(id: number) => Promise<StoredUser | null>} findById
 * @property {(id: number, passwordHash: string) => Promise<void>} setPasswordHash
 * @property {(id: number) => Promise<void>} markEmailVerified
 * @property {(id: number) => Promise<void>} delete - supprime le compte (et tout ce qui lui appartient)
 */

/**
 * @typedef {object} EmailCodeRepository - les codes de validation envoyés par e-mail (rangés hachés)
 * @property {(userId: number, minutes: number) => Promise<string>} create
 *   - un nouveau code de 6 chiffres (il remplace le précédent), valable `minutes` minutes
 * @property {(userId: number, code: string) => Promise<'valid' | 'wrong' | 'expired'>} check
 *   - 'valid' : le code est consommé ; 'wrong' : un essai de moins ; 'expired' : trop vieux, trop d'essais,
 *     ou aucun code (il faut en demander un nouveau)
 */

/**
 * @typedef {object} EmailSender - envoie un e-mail (Brevo en ligne ; le terminal ou une boîte de test en local)
 * @property {(message: { to: string, subject: string, text: string }) => Promise<void>} send
 */

/**
 * @typedef {object} SessionRepository
 * @property {(userId: number, days: number) => Promise<string>} open
 *   - ouvre une session de `days` jours et renvoie son jeton secret (à donner au navigateur, jamais stocké tel quel)
 * @property {(token: string) => Promise<User | null>} findUser - le lecteur d'une session encore valide, ou null
 * @property {(token: string) => Promise<void>} close - ferme la session (déconnexion)
 */

/**
 * @typedef {object} PasswordHasher
 * @property {(password: import('./Password.js').Password) => Promise<string>} hash
 * @property {(password: string, passwordHash: string | null) => Promise<boolean>} matches
 *   - le mot de passe correspond-il ? passwordHash null (compte inconnu) : fait le même calcul, puis non
 *     (la réponse prend le même temps : on ne peut pas deviner quels e-mails ont un compte)
 */

export {};
