// Tests unitaires des use cases des comptes (créer, se connecter, se déconnecter, qui est connecté,
// supprimer), avec de faux repositories en mémoire et un faux hachage : ni base, ni scrypt.

import { describe, test, expect, beforeEach } from 'vitest';
import { makeCreateAccount } from '../../src/application/createAccount.js';
import { makeLogIn } from '../../src/application/logIn.js';
import { makeLogOut } from '../../src/application/logOut.js';
import { makeGetCurrentUser } from '../../src/application/getCurrentUser.js';
import { makeDeleteAccount } from '../../src/application/deleteAccount.js';
import { SESSION_DAYS } from '../../src/application/sessions.js';

// Faux « monde » : des comptes et des sessions en mémoire, respectant les ports de domain/AccountRepository.js
function fakeAccounts() {
  const users = new Map();
  const sessions = new Map();
  let nextId = 1;

  const userRepository = {
    async create(email, passwordHash) {
      if ([...users.values()].some((user) => user.email === email.value)) return null;
      const user = { id: nextId++, email: email.value, passwordHash };
      users.set(user.id, user);
      return { id: user.id, email: user.email };
    },
    findByEmail: async (email) => [...users.values()].find((user) => user.email === email.value) ?? null,
    findById: async (id) => users.get(id) ?? null,
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
  const passwordHasher = {
    hash: async (password) => `hashed:${password.value}`,
    matches: async (password, passwordHash) => passwordHash === `hashed:${password}`,
  };
  return { users, sessions, dependencies: { userRepository, sessionRepository, passwordHasher } };
}

const FORM = { email: 'Marin@Exemple.fr', password: 'un mot de passe long' };

describe('les comptes', () => {
  let world;
  let createAccount;
  let logIn;

  beforeEach(() => {
    world = fakeAccounts();
    createAccount = makeCreateAccount(world.dependencies);
    logIn = makeLogIn(world.dependencies);
  });

  test('créer un compte : e-mail en minuscules, mot de passe haché, connecté dans la foulée (30 jours)', async () => {
    const { user, token } = await createAccount(FORM);

    expect(user).toEqual({ email: 'marin@exemple.fr' });
    expect([...world.users.values()][0].passwordHash).toBe('hashed:un mot de passe long');
    expect(world.sessions.get(token).days).toBe(SESSION_DAYS);
  });

  test('créer un compte avec un e-mail déjà pris : ConflictError', async () => {
    await createAccount(FORM);

    await expect(createAccount({ ...FORM, email: 'marin@exemple.fr' })).rejects.toThrow('Un compte existe déjà');
  });

  test('créer un compte avec un mot de passe trop court : ValidationError, aucun compte créé', async () => {
    await expect(createAccount({ ...FORM, password: 'court' })).rejects.toThrow('entre 10 et 128');
    expect(world.users.size).toBe(0);
  });

  test('se connecter : une nouvelle session', async () => {
    await createAccount(FORM);

    const { user, token } = await logIn({ email: 'MARIN@exemple.fr', password: FORM.password });

    expect(user).toEqual({ email: 'marin@exemple.fr' });
    expect(world.sessions.has(token)).toBe(true);
  });

  test.each([
    ['mot de passe faux', { email: FORM.email, password: 'pas le bon mot' }],
    ['e-mail inconnu', { email: 'inconnu@exemple.fr', password: FORM.password }],
    ['e-mail mal formé', { email: 'pas-un-email', password: FORM.password }],
    ['rien du tout', {}],
  ])('se connecter, %s : le même message (on ne révèle pas quels e-mails ont un compte)', async (_, form) => {
    await createAccount(FORM);

    await expect(logIn(form)).rejects.toThrow('E-mail ou mot de passe incorrect.');
  });

  test('qui est connecté : le lecteur de la session, ou null', async () => {
    const getCurrentUser = makeGetCurrentUser(world.dependencies.sessionRepository);
    const { token } = await createAccount(FORM);

    await expect(getCurrentUser(token)).resolves.toEqual({ email: 'marin@exemple.fr' });
    await expect(getCurrentUser('jeton-inconnu')).resolves.toBeNull();
    await expect(getCurrentUser(undefined)).resolves.toBeNull();
  });

  test('se déconnecter ferme la session ; sans session, rien à faire', async () => {
    const logOut = makeLogOut(world.dependencies.sessionRepository);
    const { token } = await createAccount(FORM);

    await logOut(token);
    await logOut(undefined);

    expect(world.sessions.has(token)).toBe(false);
  });

  test('supprimer son compte : il faut être connecté et retaper son mot de passe', async () => {
    const deleteAccount = makeDeleteAccount(world.dependencies);
    const { token } = await createAccount(FORM);

    await expect(deleteAccount(undefined, { password: FORM.password })).rejects.toThrow('Connecte-toi');
    await expect(deleteAccount(token, { password: 'pas le bon mot' })).rejects.toThrow('Mot de passe incorrect.');
    expect(world.users.size).toBe(1);

    await deleteAccount(token, { password: FORM.password });
    expect(world.users.size).toBe(0);
  });

  test('supprimer un compte déjà supprimé depuis un autre appareil : 401, pas une erreur inattendue', async () => {
    const deleteAccount = makeDeleteAccount(world.dependencies);
    const { token } = await createAccount(FORM);
    // La session existe encore, mais plus le compte
    world.dependencies.sessionRepository.findUser = async () => ({ id: 999, email: 'parti@exemple.fr' });

    await expect(deleteAccount(token, { password: FORM.password })).rejects.toThrow('Mot de passe incorrect.');
  });
});
