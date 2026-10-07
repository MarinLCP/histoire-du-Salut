// Parcours : la présentation du site à la première visite. Les trois cartes d'accueil, puis l'astuce de l'appui
// long, qui disparaît dès qu'on ouvre le menu d'un verset ; rien de tout ça à la visite suivante.

import { test, expect } from '@playwright/test';
import { firstVerse, longPress } from './helpers.js';

// Un navigateur vierge : la présentation n'a jamais été vue (les autres parcours la marquent « déjà vue »)
test.use({ storageState: { cookies: [], origins: [] } });

test('première visite : trois cartes, l\'astuce de l\'appui long, puis plus rien', async ({ page }) => {
  await page.goto('/');
  const cards = page.getByRole('dialog');
  const hint = page.getByRole('complementary', { name: 'Astuce' });

  await expect(cards.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();
  await cards.getByRole('button', { name: 'Suivant' }).click();
  await expect(cards.getByRole('heading', { name: 'La frise, ta carte' })).toBeVisible();
  await cards.getByRole('button', { name: 'Suivant' }).click();
  await cards.getByRole('button', { name: 'Commencer' }).click();
  await expect(cards).toHaveCount(0);

  // L'astuce, jusqu'à ce qu'on ouvre le menu d'un verset
  await expect(hint).toBeVisible();
  await longPress(page, firstVerse(page));
  await expect(page.getByRole('button', { name: 'Surligner' })).toBeVisible();
  await expect(hint).toHaveCount(0);

  await page.reload();
  await expect(firstVerse(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bienvenue' })).toHaveCount(0);
  await expect(hint).toHaveCount(0);
});
