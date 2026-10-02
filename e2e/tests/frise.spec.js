// Parcours de la frise (cascade à gauche du texte). En local et en CI, le flag "frise" est actif (mode dev).

import { test, expect } from '@playwright/test';

test('sur ordinateur, la frise montre les époques à gauche de l\'histoire', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, la frise est cachée (voir le test suivant)');
  await page.goto('/');

  const frise = page.getByRole('navigation', { name: 'Frise' });
  await expect(frise.getByText('Les origines')).toBeVisible();
  await expect(frise.getByText("L'accomplissement")).toBeVisible();
  // À gauche du texte : la frise finit avant que le premier titre commence
  const friseBox = await frise.boundingBox();
  const titleBox = await page.getByRole('heading', { name: 'La Création' }).boundingBox();
  expect(friseBox.x + friseBox.width).toBeLessThanOrEqual(titleBox.x);
});

test('zoom : clic sur une époque pour voir ses épisodes, clic sur sa bande pour remonter', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, la frise est cachée');
  await page.goto('/');
  const frise = page.getByRole('navigation', { name: 'Frise' });
  // On clique sur le titre : le bas d'un bloc est recouvert par les blocs suivants de l'escalier
  const clickBlock = (name) => frise.getByRole('button', { name }).getByText(name).click();

  await clickBlock('La royauté');
  await expect(frise.getByRole('button', { name: 'La dédicace du Temple' })).toBeVisible();
  await expect(frise.getByRole('button', { name: 'Jésus' })).toHaveCount(0);

  await clickBlock('La royauté');
  await expect(frise.getByRole('button', { name: 'Jésus' })).toBeVisible();
});

test('sur téléphone, pas la place : la frise est cachée', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Sur ordinateur, la frise est visible (voir le test précédent)');
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'La Création' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Frise' })).toBeHidden();
});
