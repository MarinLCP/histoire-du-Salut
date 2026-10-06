// Parcours : les parallèles d'un verset (dans les deux lectures), depuis le menu du verset ; panneau à droite.

import { test, expect } from '@playwright/test';
import { firstVerse, longPress } from './helpers.js';

test('dans la Bible entière : voir les parallèles de Gn 1,1, en voir plus, puis aller au plus voté', async ({ page }) => {
  await page.goto('/bible');
  await longPress(page, firstVerse(page));
  await page.getByRole('button', { name: 'Voir les parallèles' }).click();

  const panel = page.getByRole('dialog', { name: 'Parallèles de Gn 1,1' });
  const items = panel.getByRole('listitem');
  // Le plus voté : Jn 1,1-3 (« Au commencement était le Verbe »)
  await expect(items.first()).toContainText('Jn 1,1-3');
  await expect(items).toHaveCount(10);
  await panel.getByRole('button', { name: 'Voir plus' }).click();
  await expect(items).toHaveCount(20);
  await expect(panel.getByRole('link', { name: 'OpenBible.info' })).toBeVisible();

  await items.first().getByRole('link').click();

  await expect(page).toHaveURL(/\/bible\?livre=Jn&chapitre=1&verset=1$/);
  await expect(panel).toBeHidden();
  await expect(page.getByRole('button', { name: /AU COMMENCEMENT était le Verbe/ })).toBeInViewport();
});

test('dans l\'histoire du salut aussi : « Voir les parallèles » (à la place de « Fermer ») ouvre le panneau', async ({ page }) => {
  await page.goto('/');
  await longPress(page, firstVerse(page));

  await expect(page.getByRole('button', { name: 'Fermer' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Voir les parallèles' }).click();

  await expect(page.getByRole('dialog', { name: 'Parallèles de Gn 1,1' }).getByRole('listitem').first()).toContainText('Jn 1,1-3');
});
