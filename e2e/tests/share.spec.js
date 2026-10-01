// Parcours : partager un passage, et ouvrir un lien partagé.

import { test, expect } from '@playwright/test';
import { allowClipboard, firstTitle, readClipboard } from './helpers.js';

test('un lien partagé ouvre l\'app directement sur le passage', async ({ page }) => {
  await page.goto('/?passage=serviteur-souffrant');

  await expect(firstTitle(page)).toHaveText('Le Serviteur souffrant');
});

test('depuis un lien partagé, on peut revenir au début de l\'histoire', async ({ page }) => {
  await page.goto('/?passage=serviteur-souffrant');

  await page.getByRole('link', { name: /Revenir au début/ }).click();

  await expect(firstTitle(page)).toHaveText('La Création');
});

test('un lien vers un passage inconnu ouvre l\'histoire depuis le début', async ({ page }) => {
  await page.goto('/?passage=passage-qui-n-existe-pas');

  await expect(firstTitle(page)).toHaveText('La Création');
});

test('"Partager" copie le lien direct du passage (ordinateur)', async ({ page, context, browserName }) => {
  await allowClipboard(context, browserName);
  await page.goto('/');

  await page.getByRole('button', { name: 'Partager' }).first().click();
  await expect(page.getByRole('button', { name: 'Lien copié ✓' })).toBeVisible();

  const copied = await readClipboard(page);
  expect(copied).toBe('http://localhost:5173/?passage=creation');
});
