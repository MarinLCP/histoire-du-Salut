// Parcours : lire la Bible entière (page /bible, visible en dev grâce aux feature flags).

import { test, expect } from '@playwright/test';
import { firstVerse, longPress, scrollUntilVisible } from './helpers.js';

test('la Bible commence à la Genèse, chapitre 1, et la suite arrive en défilant', async ({ page }) => {
  await page.goto('/bible');

  await expect(page.getByRole('heading', { name: 'La Genèse' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chapitre 1' })).toBeVisible();

  const chapter3 = page.getByRole('heading', { name: 'Chapitre 3' });
  await scrollUntilVisible(page, chapter3, 20);
  await expect(chapter3).toBeVisible();
});

test('un verset surligné dans la Bible l\'est aussi dans l\'histoire du salut (même verset, Gn 1,1)', async ({ page }) => {
  await page.goto('/bible');
  const verse = firstVerse(page);
  await expect(verse).toBeVisible();

  await longPress(page, verse);
  await page.getByRole('button', { name: 'Surligner' }).click();

  await expect(verse).toHaveClass(/verse-highlighted/);

  // On attend d'être vraiment sur l'histoire du salut (sinon on regarderait encore le verset de la page Bible)
  await page.getByRole('link', { name: 'Histoire du salut' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'La Création' })).toBeVisible();
  await expect(firstVerse(page)).toHaveClass(/verse-highlighted/);
});
