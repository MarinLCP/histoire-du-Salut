// Parcours : le menu d'un verset (appui long) pour surligner, écrire une note, copier.

import { test, expect } from '@playwright/test';
import { firstVerse, longPress } from './helpers.js';

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

test('écrire une note, la voir sous le verset, et la retrouver après avoir rechargé', async ({ page }) => {
  const note = 'Tout commence par une parole';

  await longPress(page, firstVerse(page));
  await page.getByRole('button', { name: 'Ajouter une note' }).click();
  await page.getByRole('textbox', { name: 'Ma note' }).fill(note);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText(note)).toBeVisible();

  await page.reload();

  await expect(page.getByText(note)).toBeVisible();
});

test('copier un verset avec sa référence', async ({ page, context, browserName }) => {
  // Lire le presse-papiers depuis un test n'est autorisé que dans Chromium
  test.skip(browserName !== 'chromium', 'Lecture du presse-papiers impossible dans WebKit');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await longPress(page, firstVerse(page));
  await page.getByRole('button', { name: 'Copier le verset' }).click();
  await expect(page.getByRole('button', { name: 'Verset copié ✓' })).toBeVisible();

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('AU COMMENCEMENT');
  expect(copied).toContain('(Gn 1,1)');
});
