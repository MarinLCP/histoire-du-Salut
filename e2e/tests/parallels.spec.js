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

test('écran large : le panneau se fixe à droite, la lecture continue à côté, « Fermer » le referme', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, le panneau passe par-dessus la lecture');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/bible');
  await longPress(page, firstVerse(page));
  await page.getByRole('button', { name: 'Voir les parallèles' }).click();

  const panel = page.getByRole('complementary', { name: 'Parallèles de Gn 1,1' });
  await expect(panel.getByRole('listitem').first()).toContainText('Jn 1,1-3');
  // Pas de fenêtre par-dessus : le texte reste lisible et cliquable à côté
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(firstVerse(page)).toBeInViewport();

  await panel.getByRole('listitem').first().getByRole('link').click();
  await expect(page).toHaveURL(/verset=1$/);
  await expect(panel).toBeVisible();

  await panel.getByRole('button', { name: 'Fermer' }).click();
  await expect(panel).toHaveCount(0);
});

test('la marge : les parallèles les plus votés à côté du verset (dessous sur téléphone) ; un clic mène au verset', async ({ page }) => {
  await page.goto('/bible');
  const margin = page.getByRole('list', { name: 'Parallèles de Gn 1,1', exact: true });

  await expect(margin.getByRole('link')).toHaveText(['Jn 1,1-3', 'He 11,3', 'Is 45,18']);
  await margin.getByRole('link', { name: 'Jn 1,1-3' }).click();

  await expect(page).toHaveURL(/\/bible\?livre=Jn&chapitre=1&verset=1$/);
  await expect(page.getByRole('button', { name: /AU COMMENCEMENT était le Verbe/ })).toBeInViewport();
});

test('« Revenir à … » : après un parallèle de la marge, retour au verset de départ (Bible entière)', async ({ page }) => {
  await page.goto('/bible');
  await page.getByRole('list', { name: 'Parallèles de Gn 1,1', exact: true }).getByRole('link', { name: 'Jn 1,1-3' }).click();
  await expect(page).toHaveURL(/livre=Jn/);

  await page.getByRole('button', { name: 'Revenir à Gn 1,1' }).click();

  await expect(page).toHaveURL(/\/bible\?livre=Gn&chapitre=1&verset=1$/);
  await expect(firstVerse(page)).toBeInViewport();
  await expect(page.getByRole('button', { name: /Revenir à/ })).toHaveCount(0);
});

test('« Revenir à … » depuis un épisode : retour à l\'épisode, au verset de départ', async ({ page }) => {
  await page.goto('/?passage=chute');
  await page.getByRole('list', { name: 'Parallèles de Gn 3,15', exact: true }).getByRole('link').first().click();
  await expect(page).toHaveURL(/\/bible\?/);

  await page.getByRole('button', { name: 'Revenir à Gn 3,15' }).click();

  await expect(page).toHaveURL(/\/\?passage=chute$/);
  await expect(page.locator('[data-verse="Gn 3,15"]')).toBeInViewport();
});
