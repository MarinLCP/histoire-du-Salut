// Use cases : valider son adresse avec le code reçu par e-mail (la session s'ouvre alors), ou demander
// un nouveau code. Renvoie { user: { email }, token } une fois validée.

import { Email } from '../domain/Email.js';
import { ValidationError } from '../domain/errors.js';
import { openSession } from './sessions.js';
import { CODE_DIGITS, MAX_CODE_ATTEMPTS, sendVerificationCode } from './emailCodes.js';

const CODE_FORMAT = new RegExp(`^\\d{${CODE_DIGITS}}$`);
const WRONG_CODE = 'Code incorrect.';
const EXPIRED_CODE = 'Ce code n\'est plus valable : demandes-en un nouveau.';

/** @param {{ userRepository, sessionRepository, emailCodeRepository }} dependencies (ports : domain/AccountRepository.js) */
export function makeVerifyEmail({ userRepository, sessionRepository, emailCodeRepository }) {
  /** @param {{ email?: unknown, code?: unknown }} form */
  return async function verifyEmail(form) {
    const code = String(form.code ?? '').trim();
    if (!CODE_FORMAT.test(code)) throw new ValidationError(`Le code fait ${CODE_DIGITS} chiffres.`);
    const user = await userRepository.findByEmail(new Email(form.email));
    if (!user || user.emailVerifiedAt) throw new ValidationError(EXPIRED_CODE);

    const result = await emailCodeRepository.check(user.id, code, MAX_CODE_ATTEMPTS);
    if (result === 'wrong') throw new ValidationError(WRONG_CODE);
    if (result === 'expired') throw new ValidationError(EXPIRED_CODE);

    await userRepository.markEmailVerified(user.id);
    return openSession(sessionRepository, user);
  };
}

// Un nouveau code, seulement pour un compte pas encore validé. Même réponse dans tous les cas (rien à apprendre)
/** @param {{ userRepository, emailCodeRepository, emailSender }} dependencies */
export function makeResendEmailCode(dependencies) {
  return async function resendEmailCode(form) {
    const user = await dependencies.userRepository.findByEmail(new Email(form.email));
    if (!user || user.emailVerifiedAt) return;
    await sendVerificationCode(dependencies, user);
  };
}
