// Parcours : le panneau Paramètres (taille du texte, thème, retenus après rechargement).

import { test, expect } from '@playwright/test';
import { firstVerse, longPress } from './helpers.js';

const fontSizeOf = (locator) => locator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
const backgroundOf = (page) => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

test('choisir un texte plus grand et le thème sombre ; les réglages restent après rechargement', async ({ page }) => {
  await page.goto('/');
  const verse = firstVerse(page);
  await expect(verse).toBeVisible();
  const normalSize = await fontSizeOf(verse);

  await page.getByRole('button', { name: 'Mon compte' }).click();
  await page.getByText('Grande', { exact: true }).click();
  await page.getByText('Sombre', { exact: true }).click();
  await page.getByRole('button', { name: 'Fermer' }).click();

  expect(await fontSizeOf(verse)).toBeGreaterThan(normalSize);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await fontSizeOf(firstVerse(page))).toBeGreaterThan(normalSize);
  expect(await backgroundOf(page)).toBe("rgb(25, 25, 25)");
});
