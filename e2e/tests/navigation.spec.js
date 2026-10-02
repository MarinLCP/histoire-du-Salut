// Parcours : passer d'une page à l'autre (histoire du salut, Bible entière).

import { test, expect } from '@playwright/test';
import { firstTitle } from './helpers.js';

test('ouvrir directement /bible affiche la Bible entière', async ({ page }) => {
  await page.goto('/bible');

  await expect(page.getByRole('heading', { name: 'La Bible entière' })).toBeVisible();
});

test('la barre de navigation passe d\'une page à l\'autre, et Précédent ramène en arrière', async ({ page }) => {
  await page.goto('/');
  await expect(firstTitle(page)).toHaveText('La Création');

  await page.getByRole('link', { name: 'Bible entière' }).click();
  await expect(page).toHaveURL(/\/bible$/);
  await expect(page.getByRole('heading', { name: 'La Bible entière' })).toBeVisible();

  await page.goBack();
  await expect(firstTitle(page)).toHaveText('La Création');
});
