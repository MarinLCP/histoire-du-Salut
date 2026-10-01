// Parcours : lire toute l'histoire en scrollant.

import { test, expect } from '@playwright/test';
import { scrollToBottom } from './helpers.js';

test('en scrollant, on parcourt toute l\'histoire, de la Création à la fin, sans doublon', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'La Création' })).toBeVisible();

  const end = page.getByText('Tu as parcouru toute l\'histoire.');
  // Garde-fou : on arrête de scroller au bout de 50 essais au lieu de tourner à l'infini
  for (let attempt = 0; attempt < 50 && !(await end.isVisible()); attempt++) {
    await scrollToBottom(page);
    await page.waitForTimeout(300);
  }
  await expect(end).toBeVisible();

  const titles = await page.getByRole('heading', { level: 2 }).allTextContents();
  expect(titles[0]).toBe('La Création');
  expect(titles.at(-1)).toBe('La nouvelle création');
  expect(new Set(titles).size).toBe(titles.length);
});
