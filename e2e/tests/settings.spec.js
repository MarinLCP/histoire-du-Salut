// Parcours : le panneau Paramètres (taille du texte, thème, retenus après rechargement),
// et la sauvegarde des notes et surlignages (télécharger, puis réimporter).

import { test, expect } from '@playwright/test';
import { firstVerse, longPress } from './helpers.js';

const fontSizeOf = (locator) => locator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
const backgroundOf = (page) => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

test('choisir un texte plus grand et le thème sombre ; les réglages restent après rechargement', async ({ page }) => {
  await page.goto('/');
  const verse = firstVerse(page);
  await expect(verse).toBeVisible();
  const normalSize = await fontSizeOf(verse);

  await page.getByRole('button', { name: 'Paramètres' }).click();
  await page.getByText('Grande', { exact: true }).click();
  await page.getByText('Sombre', { exact: true }).click();
  await page.getByRole('button', { name: 'Fermer' }).click();

  expect(await fontSizeOf(verse)).toBeGreaterThan(normalSize);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await fontSizeOf(firstVerse(page))).toBeGreaterThan(normalSize);
  expect(await backgroundOf(page)).toBe("rgb(27, 26, 24)");
});

test('sauvegarde : télécharger ses surlignages, tout effacer, réimporter le fichier, les retrouver', async ({ page }) => {
  await page.goto('/');
  await longPress(page, firstVerse(page));
  await page.getByRole('button', { name: 'Surligner' }).click();

  await page.getByRole('button', { name: 'Paramètres' }).click();
  await expect(page.getByText('1 surlignage et 0 note')).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Télécharger une sauvegarde' }).click(),
  ]);
  const backupPath = await download.path();

  // Le navigateur est vidé : plus rien
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await expect(page.getByText('0 surlignage et 0 note')).toBeVisible();

  await page.getByLabel('Importer une sauvegarde').setInputFiles(backupPath);
  await expect(page.getByText('Importé : 1 surlignage et 0 note.')).toBeVisible();
  await page.getByRole('button', { name: 'Fermer' }).click();
  await longPress(page, firstVerse(page));
  await expect(page.getByRole('button', { name: 'Retirer le surlignage' })).toBeVisible();
});
