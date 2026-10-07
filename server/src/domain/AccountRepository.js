// Ports (contrats) des comptes : ce dont les use cases ont besoin, sans dire COMMENT.
// Les implémentations sont dans infrastructure/ (PostgreSQL pour les comptes et les sessions, scrypt pour
// le hachage) ; les tests utilisent de faux objets en mémoire qui respectent les mêmes contrats.

/**
 * @typedef {object} User
 * @property {number} id
 * @property {string} email
 */

/**
 * @typedef {User & { passwordHash: string | null, emailVerifiedAt: string | null }} StoredUser
 *   - passwordHash : null pour un compte Google sans mot de passe
 *   - emailVerifiedAt : quand l'e-mail a été validé (null : pas encore, pas de session possible)
 */

/**
 * @typedef {object} UserRepository
 * @property {(email: import('./Email.js').Email, passwordHash: string) => Promise<User | null>} create
 *   - crée le compte, pas encore validé ; null si un compte existe déjà avec cet e-mail
 * @property {(email: import('./Email.js').Email) => Promise<StoredUser | null>} findByEmail
 * @property {(id: number) => Promise<StoredUser | null>} findById
 * @property {(id: number, passwordHash: string | null) => Promise<void>} setPasswordHash
 * @property {(googleSub: string) => Promise<StoredUser | null>} findByGoogleSub
 * @property {(email: import('./Email.js').Email, googleSub: string, givenName: string | null) => Promise<User | null>} createFromGoogle
 *   - un compte Google : e-mail déjà validé (par Google), sans mot de passe ; null si l'e-mail est déjà pris
 * @property {(id: number, googleSub: string, givenName: string | null) => Promise<void>} linkGoogle
 *   - relie le compte à Google (et range le prénom donné par Google)
 * @property {(id: number) => Promise<void>} markEmailVerified
 * @property {(id: number) => Promise<void>} delete - supprime le compte (et tout ce qui lui appartient)
 */

/**
 * @typedef {object} EmailCodeRepository - les codes de validation envoyés par e-mail (rangés hachés)
 * @property {(userId: number, rules: { digits: number, minutes: number }) => Promise<string>} create
 *   - un nouveau code de `digits` chiffres (il remplace le précédent), valable `minutes` minutes
 * @property {(userId: number, code: string, maxAttempts: number) => Promise<'valid' | 'wrong' | 'expired'>} check
 *   - 'valid' : le code est consommé ; 'wrong' : un essai de moins ; 'expired' : trop vieux, `maxAttempts`
 *     essais déjà faits, ou aucun code (il faut en demander un nouveau)
 *   (les règles du code, 6 chiffres, 15 minutes, 5 essais : application/emailCodes.js)
 */

/**
 * @typedef {object} GoogleIdentity - se connecter avec Google (OpenID Connect, flux « code »)
 * @property {(request: { state: string, codeChallenge: string, nonce: string }) => string} authorizationUrl
 *   - l'adresse de la page de connexion de Google
 * @property {(exchange: { code: string, codeVerifier: string, nonce: string }) => Promise<GoogleClaims>} exchangeCode
 *   - échange le code reçu au retour contre l'identité du lecteur, entièrement vérifiée (émetteur, destinataire,
 *     expiration, nonce de l'aller)
 */

/**
 * @typedef {object} GoogleClaims - ce que Google dit du lecteur
 * @property {string} sub - son identifiant chez Google
 * @property {string} email
 * @property {boolean} emailVerified - Google a vérifié que l'adresse est à lui
 * @property {string | null} givenName - son prénom, tel que Google le donne (nettoyé ensuite : domain/publicName.js)
 */

/**
 * @typedef {object} EmailSender - envoie un e-mail (Brevo en ligne ; le terminal ou une boîte de test en local)
 * @property {(message: { to: string, subject: string, text: string }) => Promise<void>} send
 */

/**
 * @typedef {object} SessionRepository
 * @property {(userId: number, days: number) => Promise<string>} open
 *   - ouvre une session de `days` jours et renvoie son jeton secret (à donner au navigateur, jamais stocké tel quel)
 * @property {(token: string) => Promise<(User & { hasPassword: boolean }) | null>} findUser
 *   - le lecteur d'une session encore valide, ou null
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
