// Parcours : le menu d'un verset (appui long) pour surligner, poser le marque-page, écrire une note (il faut un
// compte), copier.

import { test, expect } from '@playwright/test';
import { allowClipboard, enterEmailCode, firstVerse, longPress, openAccount, readClipboard, uniqueEmail } from './helpers.js';

const PASSWORD = 'un mot de passe long';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(firstVerse(page)).toBeVisible();
});

test('un toucher bref n\'ouvre pas le menu', async ({ page }) => {
  await firstVerse(page).click();

  await expect(page.getByRole('dialog')).toBeHidden();
});

test('surligner un verset, et le retrouver surligné après avoir rechargé la page', async ({ page }) => {
  await longPress(page, firstVerse(page));
  await page.getByRole('button', { name: 'Surligner' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.reload();
  await longPress(page, firstVerse(page));

  await expect(page.getByRole('button', { name: 'Retirer le surlignage' })).toBeVisible();
});

test('poser le marque-page sur un verset : il y reste quand on lit plus loin, jusqu\'à ce qu\'on le retire', async ({ page, isMobile }) => {
  const tag = page.getByText('Marque-page', { exact: true });
  await longPress(page, firstVerse(page));
  await page.getByRole('button', { name: 'Poser le marque-page ici' }).click();
  await expect(tag).toBeVisible();

  // Lire plus loin, assez longtemps pour que la lecture soit retenue : le marque-page posé à la main ne suit pas
  await page.getByRole('heading', { name: "L'appel d'Abraham" }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(2500);
  await page.goto('/');

  await expect(tag).toBeVisible();
  // Sur ordinateur, le ruban de la frise le montre aussi (sur téléphone, la frise est dans un panneau)
  if (!isMobile) await expect(page.getByRole('button', { name: /Reprendre la lecture.*Les origines/ })).toBeVisible();

  await longPress(page, firstVerse(page));
  await page.getByRole('button', { name: 'Retirer le marque-page' }).click();
  await expect(tag).toHaveCount(0);
});

test('une note demande un compte : on le crée sur place, la note est gardée, privée, et retrouvée', async ({ page }) => {
  const note = 'Tout commence par une parole';
  const email = uniqueEmail('note');
  const menu = page.getByRole('dialog');

  // Sans compte : « Enregistrer » propose d'en créer un
  await longPress(page, firstVerse(page));
  await menu.getByRole('button', { name: 'Ajouter une note' }).click();
  await menu.getByRole('textbox', { name: 'Ma note' }).fill(note);
  await menu.getByRole('button', { name: 'Enregistrer' }).click();
  await menu.getByLabel('E-mail').fill(email);
  await menu.getByLabel(/^Mot de passe/).fill(PASSWORD);
  await menu.getByRole('button', { name: 'Créer mon compte' }).click();
  await enterEmailCode(page, menu, email);

  // Le compte créé, la note qui attendait est enregistrée
  await expect(page.getByText(note)).toBeVisible();
  await page.reload();
  await expect(page.getByText(note)).toBeVisible();

  // Déconnecté : la note n'est plus sur cet appareil ; reconnecté : elle revient
  const account = await openAccount(page);
  await account.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByText(note)).toBeHidden();
  await account.getByLabel('E-mail').fill(email);
  await account.getByLabel(/^Mot de passe/).fill(PASSWORD);
  await account.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText(note)).toBeAttached();

  // Le test ne laisse rien derrière lui
  await account.getByRole('button', { name: 'Supprimer mon compte' }).click();
  await account.getByLabel(/pour confirmer/).fill(PASSWORD);
  await account.getByRole('button', { name: 'Supprimer définitivement' }).click();
  await expect(account.getByRole('button', { name: 'Se connecter' })).toBeVisible();
});

test('copier un verset avec sa référence', async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);

  await longPress(page, firstVerse(page));
  await page.getByRole('button', { name: 'Copier le verset' }).click();
  await expect(page.getByRole('button', { name: 'Verset copié ✓' })).toBeVisible();

  const copied = await readClipboard(page);
  expect(copied).toContain('AU COMMENCEMENT');
  expect(copied).toContain('(Gn 1,1)');
});
