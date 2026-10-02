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

test('lecture : le bloc lu est surligné, et la frise le suit quand on avance', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, la frise est cachée');
  await page.goto('/');
  const frise = page.getByRole('navigation', { name: 'Frise' });

  await expect(frise.getByRole('button', { name: 'Les origines' })).toHaveAttribute('aria-current', 'location');
  await page.getByRole('heading', { name: "L'appel d'Abraham" }).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 200);
  await expect(frise.getByRole('button', { name: 'Les patriarches' })).toHaveAttribute('aria-current', 'location');
});

test('clic sur un bloc : la lecture y saute, même s\'il n\'est pas encore chargé', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, la frise est cachée');
  await page.goto('/');
  const frise = page.getByRole('navigation', { name: 'Frise' });

  await frise.getByRole('button', { name: 'Jésus' }).getByText('Jésus').click();

  await expect(page.getByRole('heading', { name: 'Annonciation et Nativité' })).toBeInViewport();
  await expect(frise.getByRole('button', { name: 'Annonciation et Nativité' })).toHaveAttribute('aria-current', 'location');
});

test('Bible entière : ensembles → livres → dizaines → chapitres, et la lecture saute au Psaume 23', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, la frise est cachée');
  await page.goto('/bible');
  const frise = page.getByRole('navigation', { name: 'Frise' });
  const clickBlock = (name) => frise.getByRole('button', { name, exact: true }).getByText(name, { exact: true }).click();

  await clickBlock('Les livres poétiques et sapientiaux');
  await clickBlock('Livre des Psaumes');
  await clickBlock('Chapitres 20-29');
  await clickBlock('Chapitre 23');

  await expect(page.getByRole('heading', { name: 'Chapitre 23', exact: true })).toBeInViewport();
  await expect(frise.getByRole('button', { name: 'Chapitre 23', exact: true })).toHaveAttribute('aria-current', 'location');
});

test('sur téléphone, pas la place : la frise est cachée', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Sur ordinateur, la frise est visible (voir le test précédent)');
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'La Création' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Frise' })).toBeHidden();
});
