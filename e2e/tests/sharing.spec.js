// Parcours : partager où j'en suis. Un lecteur connecté partage son lien ; quelqu'un d'autre, sans compte,
// l'ouvre et voit où il en est (jamais ses notes ni son e-mail), puis peut lire au même endroit.
// « Arrêter de partager » rend le lien inutilisable. Le test supprime son compte à la fin.

import { test, expect } from '@playwright/test';
import { createAccountByApi, openAccount, uniqueEmail } from './helpers.js';

const PASSWORD = 'un mot de passe long';

test('partager où j\'en suis, l\'ouvrir sans compte, puis arrêter de partager', async ({ page, browser }) => {
  // Pas de feuille de partage (le test ne peut pas la fermer) : le lien est copié
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'share', { value: undefined }));
  const email = uniqueEmail('partage');
  await page.goto('/');

  // Un compte, et un marque-page dans l'épisode n° 2 (posé directement : pas besoin de lire pour de vrai)
  await createAccountByApi(page, email, PASSWORD);
  await page.request.put('/api/me/bookmarks/history', { data: { position: 2.4 } });
  await page.reload();

  const account = await openAccount(page);
  await account.getByRole('button', { name: 'Partager où j\'en suis' }).click();
  await expect(account.getByRole('button', { name: 'Arrêter de partager' })).toBeVisible();
  const { token } = await (await page.request.get('/api/me/sharing')).json();

  // Quelqu'un d'autre, sans compte (un autre navigateur)
  const friend = await (await browser.newContext()).newPage();
  await friend.goto(`/progression/${token}`);
  // Un compte e-mail n'a pas de prénom (seul un compte Google en donne un)
  await expect(friend.getByRole('heading', { name: 'Où en est la personne qui t\'a envoyé ce lien' })).toBeVisible();
  await expect(friend.getByText(/Épisode 2 sur 32/)).toBeVisible();
  await friend.getByRole('link', { name: 'Lire au même endroit' }).click();
  await expect(friend.getByRole('heading', { name: 'La chute' })).toBeVisible();

  await account.getByRole('button', { name: 'Arrêter de partager' }).click();
  await expect(account.getByText('Le lien ne mène plus nulle part.')).toBeVisible();
  await friend.goto(`/progression/${token}`);
  await expect(friend.getByRole('heading', { name: 'Ce lien de partage n\'existe pas, ou plus.' })).toBeVisible();

  // Le test ne laisse rien derrière lui
  await page.request.delete('/api/account', { data: { password: PASSWORD } });
});
