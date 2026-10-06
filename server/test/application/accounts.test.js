// Tests unitaires des use cases des comptes (créer, valider l'e-mail, se connecter, se déconnecter, qui est
// connecté, supprimer), avec de faux repositories en mémoire, un faux hachage et une fausse boîte d'envoi :
// ni base, ni scrypt, ni e-mail.

import { describe, test, expect, beforeEach } from 'vitest';
import { makeCreateAccount } from '../../src/application/createAccount.js';
import { makeVerifyEmail, makeResendEmailCode } from '../../src/application/verifyEmail.js';
import { makeLogIn } from '../../src/application/logIn.js';
import { makeLogOut } from '../../src/application/logOut.js';
import { makeGetCurrentUser } from '../../src/application/getCurrentUser.js';
import { makeDeleteAccount } from '../../src/application/deleteAccount.js';
import { SESSION_DAYS } from '../../src/application/sessions.js';

// Faux « monde » : comptes, sessions, codes et e-mails envoyés, en mémoire (ports de domain/AccountRepository.js)
function fakeAccounts() {
  const users = new Map();
  const sessions = new Map();
  const codes = new Map();
  const sent = [];
  let nextId = 1;
  let nextCode = 100000;

  const userRepository = {
    async create(email, passwordHash) {
      if ([...users.values()].some((user) => user.email === email.value)) return null;
      const user = { id: nextId++, email: email.value, passwordHash, emailVerifiedAt: null };
      users.set(user.id, user);
      return { id: user.id, email: user.email };
    },
    findByEmail: async (email) => [...users.values()].find((user) => user.email === email.value) ?? null,
    findById: async (id) => users.get(id) ?? null,
    setPasswordHash: async (id, passwordHash) => { users.get(id).passwordHash = passwordHash; },
    markEmailVerified: async (id) => { users.get(id).emailVerifiedAt = 'maintenant'; },
    delete: async (id) => { users.delete(id); },
  };
  const sessionRepository = {
    async open(userId, days) {
      const token = `jeton-${sessions.size + 1}`;
      sessions.set(token, { userId, days });
      return token;
    },
    async findUser(token) {
      const user = users.get(sessions.get(token)?.userId);
      return user ? { id: user.id, email: user.email } : null;
    },
    close: async (token) => { sessions.delete(token); },
  };
  const emailCodeRepository = {
    async create(userId) {
      const code = String(nextCode++);
      codes.set(userId, code);
      return code;
    },
    async check(userId, code) {
      if (!codes.has(userId)) return 'expired';
      if (codes.get(userId) !== code) return 'wrong';
      codes.delete(userId);
      return 'valid';
    },
  };
  const passwordHasher = {
    hash: async (password) => `hashed:${password.value}`,
    matches: async (password, passwordHash) => passwordHash === `hashed:${password}`,
  };
  const emailSender = { send: async (message) => { sent.push(message); } };
  return {
    users, sessions, sent,
    dependencies: { userRepository, sessionRepository, passwordHasher, emailCodeRepository, emailSender },
  };
}

const FORM = { email: 'Marin@Exemple.fr', password: 'un mot de passe long' };
const lastCode = (world) => world.sent.at(-1).subject.match(/\d{6}/)[0];

describe('les comptes', () => {
  let world;
  let createAccount;
  let verifyEmail;
  let logIn;

  // Un compte créé ET validé (connecté une première fois)
  async function validatedAccount() {
    await createAccount(FORM);
    return verifyEmail({ email: FORM.email, code: lastCode(world) });
  }

  beforeEach(() => {
    world = fakeAccounts();
    createAccount = makeCreateAccount(world.dependencies);
    verifyEmail = makeVerifyEmail(world.dependencies);
    logIn = makeLogIn(world.dependencies);
  });

  test('créer un compte : mot de passe haché, un code envoyé par e-mail, pas encore de session', async () => {
    const result = await createAccount(FORM);

    expect(result).toEqual({ verificationNeeded: true, email: 'marin@exemple.fr' });
    expect([...world.users.values()][0]).toMatchObject({ passwordHash: 'hashed:un mot de passe long', emailVerifiedAt: null });
    expect(world.sent[0]).toMatchObject({ to: 'marin@exemple.fr', subject: expect.stringMatching(/^Ton code : \d{6}$/) });
    expect(world.sessions.size).toBe(0);
  });

  test('valider avec le bon code : compte validé, connecté (30 jours)', async () => {
    const { user, token } = await validatedAccount();

    expect(user).toEqual({ email: 'marin@exemple.fr' });
    expect([...world.users.values()][0].emailVerifiedAt).not.toBeNull();
    expect(world.sessions.get(token).days).toBe(SESSION_DAYS);
  });

  test.each([
    ['un mauvais code', '999999', 'Code incorrect.'],
    ['pas 6 chiffres', '12ab', 'Le code fait 6 chiffres.'],
  ])('valider avec %s : refusé', async (_, code, message) => {
    await createAccount(FORM);

    await expect(verifyEmail({ email: FORM.email, code })).rejects.toThrow(message);
  });

  test('un compte validé ne se recrée pas (409) ; un compte jamais validé est repris', async () => {
    await validatedAccount();
    await expect(createAccount(FORM)).rejects.toThrow('Un compte existe déjà');

    const other = { email: 'autre@exemple.fr', password: 'un mot de passe oublié' };
    await createAccount(other);
    await createAccount({ ...other, password: 'un nouveau mot de passe' });
    expect([...world.users.values()].find((user) => user.email === 'autre@exemple.fr').passwordHash)
      .toBe('hashed:un nouveau mot de passe');
  });

  test('créer un compte avec un mot de passe trop court : ValidationError, aucun compte, aucun e-mail', async () => {
    await expect(createAccount({ ...FORM, password: 'court' })).rejects.toThrow('entre 10 et 128');
    expect(world.users.size).toBe(0);
    expect(world.sent).toHaveLength(0);
  });

  test('sans service d\'envoi : la création par e-mail est indisponible (et ne crée rien)', async () => {
    const withoutSender = makeCreateAccount({ ...world.dependencies, emailSender: null });

    await expect(withoutSender(FORM)).rejects.toThrow('Continuer avec Google');
    expect(world.users.size).toBe(0);
  });

  test('renvoyer un code : seulement pour un compte pas encore validé', async () => {
    const resend = makeResendEmailCode(world.dependencies);
    await createAccount(FORM);

    await resend({ email: FORM.email });
    expect(world.sent).toHaveLength(2);
    await verifyEmail({ email: FORM.email, code: lastCode(world) });
    await resend({ email: FORM.email });
    expect(world.sent).toHaveLength(2);
  });

  test('se connecter à un compte validé : une nouvelle session', async () => {
    await validatedAccount();

    const { user, token } = await logIn({ email: 'MARIN@exemple.fr', password: FORM.password });

    expect(user).toEqual({ email: 'marin@exemple.fr' });
    expect(world.sessions.has(token)).toBe(true);
  });

  test('se connecter à un compte pas encore validé : un nouveau code, pas de session', async () => {
    await createAccount(FORM);

    const result = await logIn(FORM);

    expect(result).toEqual({ verificationNeeded: true, email: 'marin@exemple.fr' });
    expect(world.sent).toHaveLength(2);
    expect(world.sessions.size).toBe(0);
  });

  test.each([
    ['mot de passe faux', { email: FORM.email, password: 'pas le bon mot' }],
    ['e-mail inconnu', { email: 'inconnu@exemple.fr', password: FORM.password }],
    ['e-mail mal formé', { email: 'pas-un-email', password: FORM.password }],
    ['rien du tout', {}],
  ])('se connecter, %s : le même message (on ne révèle pas quels e-mails ont un compte)', async (_, form) => {
    await validatedAccount();

    await expect(logIn(form)).rejects.toThrow('E-mail ou mot de passe incorrect.');
  });

  test('qui est connecté : le lecteur de la session, ou null', async () => {
    const getCurrentUser = makeGetCurrentUser(world.dependencies.sessionRepository);
    const { token } = await validatedAccount();

    await expect(getCurrentUser(token)).resolves.toEqual({ email: 'marin@exemple.fr' });
    await expect(getCurrentUser('jeton-inconnu')).resolves.toBeNull();
    await expect(getCurrentUser(undefined)).resolves.toBeNull();
  });

  test('se déconnecter ferme la session ; sans session, rien à faire', async () => {
    const logOut = makeLogOut(world.dependencies.sessionRepository);
    const { token } = await validatedAccount();

    await logOut(token);
    await logOut(undefined);

    expect(world.sessions.has(token)).toBe(false);
  });

  test('supprimer son compte : il faut être connecté et retaper son mot de passe', async () => {
    const deleteAccount = makeDeleteAccount(world.dependencies);
    const { token } = await validatedAccount();

    await expect(deleteAccount(undefined, { password: FORM.password })).rejects.toThrow('Connecte-toi');
    await expect(deleteAccount(token, { password: 'pas le bon mot' })).rejects.toThrow('Mot de passe incorrect.');
    expect(world.users.size).toBe(1);

    await deleteAccount(token, { password: FORM.password });
    expect(world.users.size).toBe(0);
  });

  test('supprimer un compte déjà supprimé depuis un autre appareil : 401, pas une erreur inattendue', async () => {
    const deleteAccount = makeDeleteAccount(world.dependencies);
    const { token } = await validatedAccount();
    // La session existe encore, mais plus le compte
    world.dependencies.sessionRepository.findUser = async () => ({ id: 999, email: 'parti@exemple.fr' });

    await expect(deleteAccount(token, { password: FORM.password })).rejects.toThrow('Mot de passe incorrect.');
  });
});
