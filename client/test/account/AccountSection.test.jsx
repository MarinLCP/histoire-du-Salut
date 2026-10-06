// @vitest-environment jsdom
// Tests de la section « Mon compte » (panneau Paramètres), avec un faux compte : se connecter, créer un
// compte, message d'erreur, se déconnecter, supprimer son compte.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountSection from '../../src/account/AccountSection.jsx';

afterEach(cleanup);

function fakeAccount(user) {
  return {
    user,
    logIn: vi.fn().mockResolvedValue(undefined),
    createAccount: vi.fn().mockResolvedValue(undefined),
    logOut: vi.fn().mockResolvedValue(undefined),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
    verifyEmail: vi.fn().mockResolvedValue({ user: { email: 'marin@exemple.fr' } }),
    resendEmailCode: vi.fn().mockResolvedValue(undefined),
  };
}

async function fillIn(email, password) {
  await userEvent.type(screen.getByLabelText('E-mail'), email);
  await userEvent.type(screen.getByLabelText(/^Mot de passe/), password);
}

describe('AccountSection', () => {
  test('pas connecté : se connecter avec son e-mail et son mot de passe', async () => {
    const account = fakeAccount(null);
    render(<AccountSection account={account} />);

    await fillIn('marin@exemple.fr', 'un mot de passe long');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(account.logIn).toHaveBeenCalledWith({ email: 'marin@exemple.fr', password: 'un mot de passe long' });
  });

  test('« Créer un compte » passe au formulaire de création', async () => {
    const account = fakeAccount(null);
    render(<AccountSection account={account} />);

    await userEvent.click(screen.getByRole('button', { name: /Créer un compte/ }));
    await fillIn('marin@exemple.fr', 'un mot de passe long');
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(account.createAccount).toHaveBeenCalledWith({ email: 'marin@exemple.fr', password: 'un mot de passe long' });
  });

  test('un échec affiche le message du serveur', async () => {
    const account = fakeAccount(null);
    account.logIn.mockRejectedValue(new Error('E-mail ou mot de passe incorrect.'));
    render(<AccountSection account={account} />);

    await fillIn('marin@exemple.fr', 'pas le bon mot');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'E-mail ou mot de passe incorrect.');
  });

  test('connecté : l\'e-mail du compte et « Se déconnecter »', async () => {
    const account = fakeAccount({ email: 'marin@exemple.fr' });
    render(<AccountSection account={account} />);

    expect(screen.getByText('marin@exemple.fr')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(account.logOut).toHaveBeenCalled();
  });

  test('supprimer son compte demande de retaper son mot de passe', async () => {
    const account = fakeAccount({ email: 'marin@exemple.fr' });
    render(<AccountSection account={account} />);

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));
    await userEvent.type(screen.getByLabelText(/pour confirmer/), 'un mot de passe long');
    fireEvent.submit(screen.getByRole('button', { name: 'Supprimer définitivement' }));

    expect(account.deleteAccount).toHaveBeenCalledWith({ password: 'un mot de passe long' });
  });

  test('le compte n\'a pas pu être chargé : un message, et « Réessayer »', async () => {
    const onRetryLibrary = vi.fn();
    render(<AccountSection account={fakeAccount({ email: 'marin@exemple.fr' })} libraryStatus="failed" onRetryLibrary={onRetryLibrary} />);

    expect(screen.getByRole('alert').textContent).toContain('n\'ont pas pu être chargés');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(onRetryLibrary).toHaveBeenCalled();
  });

  test('créer un compte : le code reçu par e-mail est demandé, puis validé', async () => {
    const account = fakeAccount(null);
    account.createAccount.mockResolvedValue({ verificationNeeded: true, email: 'marin@exemple.fr' });
    render(<AccountSection account={account} />);
    await userEvent.click(screen.getByRole('button', { name: /Créer un compte/ }));
    await fillIn('marin@exemple.fr', 'un mot de passe long');
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(await screen.findByText(/Un code de 6 chiffres a été envoyé/)).toBeDefined();
    await userEvent.type(screen.getByLabelText('Code reçu par e-mail'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(account.verifyEmail).toHaveBeenCalledWith({ email: 'marin@exemple.fr', code: '123456' });
  });

  test('l\'étape du code : renvoyer un code, ou changer d\'adresse', async () => {
    const account = fakeAccount(null);
    account.logIn.mockResolvedValue({ verificationNeeded: true, email: 'marin@exemple.fr' });
    render(<AccountSection account={account} />);
    await fillIn('marin@exemple.fr', 'un mot de passe long');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Renvoyer le code' }));
    expect(account.resendEmailCode).toHaveBeenCalledWith('marin@exemple.fr');
    expect(await screen.findByText('Un nouveau code vient de partir.')).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: 'Changer d\'adresse' }));
    expect(screen.getByLabelText('E-mail')).toBeDefined();
  });

  test('un mauvais code : le message du serveur', async () => {
    const account = fakeAccount(null);
    account.createAccount.mockResolvedValue({ verificationNeeded: true, email: 'marin@exemple.fr' });
    account.verifyEmail.mockRejectedValue(new Error('Code incorrect.'));
    render(<AccountSection account={account} />);
    await userEvent.click(screen.getByRole('button', { name: /Créer un compte/ }));
    await fillIn('marin@exemple.fr', 'un mot de passe long');
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    await userEvent.type(await screen.findByLabelText('Code reçu par e-mail'), '000000');
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Code incorrect.');
  });

  test('Google réglé : « Continuer avec Google » mène à la page de Google', () => {
    render(<AccountSection account={{ ...fakeAccount(null), options: { google: true, emailSignUp: true } }} />);

    expect(screen.getByRole('link', { name: 'Continuer avec Google' }).getAttribute('href')).toBe('/api/auth/google');
  });

  test('création par e-mail pas encore ouverte : le formulaire renvoie vers Google', async () => {
    render(<AccountSection account={{ ...fakeAccount(null), options: { google: true, emailSignUp: false } }} />);

    await userEvent.click(screen.getByRole('button', { name: /Créer un compte/ }));

    expect(screen.getByText(/arrive bientôt/)).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Créer mon compte' })).toBeNull();
  });

  test('compte Google sans mot de passe : supprimer en écrivant SUPPRIMER', async () => {
    const account = fakeAccount({ email: 'marin@gmail.com', hasPassword: false });
    render(<AccountSection account={account} />);

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));
    await userEvent.type(screen.getByLabelText('Écris SUPPRIMER pour confirmer'), 'SUPPRIMER');
    fireEvent.submit(screen.getByRole('button', { name: 'Supprimer définitivement' }));

    expect(account.deleteAccount).toHaveBeenCalledWith({ confirmation: 'SUPPRIMER' });
  });

  test('retour d\'une connexion Google ratée : un message', () => {
    render(<AccountSection account={fakeAccount(null)} googleFailed />);

    expect(screen.getByRole('alert').textContent).toContain('connexion avec Google n\'a pas abouti');
  });
});
