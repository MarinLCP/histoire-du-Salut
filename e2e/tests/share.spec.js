// Parcours : partager un passage, et ouvrir un lien partagé.

import { test, expect } from '@playwright/test';

test('un lien partagé ouvre l\'app directement sur le passage', async ({ page }) => {
  await page.goto('/?passage=serviteur-souffrant');

  const firstTitle = page.getByRole('heading', { level: 2 }).first();
  await expect(firstTitle).toHaveText('Le Serviteur souffrant');
});

test('depuis un lien partagé, on peut revenir au début de l\'histoire', async ({ page }) => {
  await page.goto('/?passage=serviteur-souffrant');

  await page.getByRole('link', { name: /Revenir au début/ }).click();

  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText('La Création');
});

test('un lien vers un passage inconnu ouvre l\'histoire depuis le début', async ({ page }) => {
  await page.goto('/?passage=passage-qui-n-existe-pas');

  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText('La Création');
});

test('"Partager" copie le lien direct du passage (ordinateur)', async ({ page, context, browserName }) => {
  // Lire le presse-papiers depuis un test n'est autorisé que dans Chromium
  test.skip(browserName !== 'chromium', 'Lecture du presse-papiers impossible dans WebKit');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');

  await page.getByRole('button', { name: 'Partager' }).first().click();
  await expect(page.getByRole('button', { name: 'Lien copié ✓' })).toBeVisible();

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe('http://localhost:5173/?passage=creation');
});
