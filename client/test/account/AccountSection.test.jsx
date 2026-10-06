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
});
