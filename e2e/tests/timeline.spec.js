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

  // Pas de titre de fin écrit en dur : le message de fin suffit à prouver qu'on est arrivé au bout,
  // et le test reste juste quand on ajoute ou réordonne des passages
  const titles = await page.getByRole('heading', { level: 2 }).allTextContents();
  expect(titles[0]).toBe('La Création');
  expect(new Set(titles).size).toBe(titles.length);
});

test('si l\'API ne répond pas, un message s\'affiche, et "Réessayer" relance le chargement', async ({ page }) => {
  // On simule une API en panne : toutes les requêtes de timeline répondent 500
  await page.route('**/api/timeline**', (route) => route.fulfill({ status: 500, body: 'Internal Server Error' }));
  await page.goto('/');

  await expect(page.getByRole('alert')).toContainText('Le chargement a échoué (erreur 500).');

  // L'API revient : un clic sur "Réessayer" suffit, sans recharger la page
  await page.unroute('**/api/timeline**');
  await page.getByRole('button', { name: 'Réessayer' }).click();

  await expect(page.getByRole('heading', { name: 'La Création' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
