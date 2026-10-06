// Parcours : un compte, depuis le panneau Paramètres. Créer un compte (et valider l'e-mail par le code reçu),
// rester connecté après rechargement,
// se déconnecter, se reconnecter, puis supprimer le compte (le test ne laisse rien derrière lui).

import { test, expect } from '@playwright/test';
import { emailCode } from './helpers.js';

const PASSWORD = 'un mot de passe long';

async function openAccount(page) {
  await page.getByRole('button', { name: 'Paramètres' }).click();
  return page.getByRole('region', { name: 'Mon compte' });
}

async function signIn(section, email, buttonName) {
  await section.getByLabel('E-mail').fill(email);
  await section.getByLabel(/^Mot de passe/).fill(PASSWORD);
  await section.getByRole('button', { name: buttonName }).click();
}

test('créer un compte, rester connecté, se déconnecter, se reconnecter, supprimer le compte', async ({ page }, testInfo) => {
  // Une adresse par appareil testé (les deux tournent en même temps)
  const email = `e2e-${testInfo.project.name.replace(/\W+/g, '-')}-${Date.now()}@exemple.test`.toLowerCase();
  await page.goto('/');
  let section = await openAccount(page);

  await section.getByRole('button', { name: /Créer un compte/ }).click();
  await signIn(section, email, 'Créer mon compte');
  await section.getByLabel('Code reçu par e-mail').fill(await emailCode(page, email));
  await section.getByRole('button', { name: 'Valider' }).click();
  await expect(section.getByText(email)).toBeVisible();

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
