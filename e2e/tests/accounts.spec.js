// Parcours : un compte, depuis le panneau Paramètres. Créer un compte (et valider l'e-mail par le code reçu),
// rester connecté après rechargement,
// se déconnecter, se reconnecter, puis supprimer le compte (le test ne laisse rien derrière lui).

import { test, expect } from '@playwright/test';
import { enterEmailCode, openAccount, uniqueEmail } from './helpers.js';

const PASSWORD = 'un mot de passe long';

async function signIn(section, email, buttonName) {
  await section.getByLabel('E-mail').fill(email);
  await section.getByLabel(/^Mot de passe/).fill(PASSWORD);
  await section.getByRole('button', { name: buttonName }).click();
}

test('créer un compte, rester connecté, se déconnecter, se reconnecter, supprimer le compte', async ({ page }) => {
  const email = uniqueEmail('e2e');
  await page.goto('/');
  let section = await openAccount(page);

  await section.getByRole('button', { name: /Créer un compte/ }).click();
  await signIn(section, email, 'Créer mon compte');
  await enterEmailCode(page, section, email);
  // « Se déconnecter » et pas seulement l'adresse : elle s'affiche aussi dans « code envoyé à … »
  await expect(section.getByRole('button', { name: 'Se déconnecter' })).toBeVisible();

  // La session tient après un rechargement (cookie)
  await page.reload();
  section = await openAccount(page);
  await expect(section.getByText(email)).toBeVisible();

  await section.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(section.getByRole('button', { name: 'Se connecter' })).toBeVisible();

  await signIn(section, email, 'Se connecter');
  await expect(section.getByText(email)).toBeVisible();

  await section.getByRole('button', { name: 'Supprimer mon compte' }).click();
  await section.getByLabel(/pour confirmer/).fill(PASSWORD);
  await section.getByRole('button', { name: 'Supprimer définitivement' }).click();
  await expect(section.getByRole('button', { name: 'Se connecter' })).toBeVisible();

  // Le compte n'existe plus
  await signIn(section, email, 'Se connecter');
  await expect(section.getByRole('alert')).toHaveText('E-mail ou mot de passe incorrect.');
});
