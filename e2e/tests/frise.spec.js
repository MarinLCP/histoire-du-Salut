// Parcours de la frise (cascade à gauche du texte ; panneau « Frise » sur téléphone).

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

test('en bas de la lecture : la barre du haut reste visible, la frise va jusqu\'en bas de l\'écran', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, la frise est dans un panneau');
  await page.goto('/');
  await page.getByRole('heading', { name: 'La Création' }).waitFor();
  await page.mouse.wheel(0, 4000);

  await expect(page.getByRole('navigation', { name: 'Pages' })).toBeInViewport();
  const friseBox = await page.getByRole('navigation', { name: 'Frise' }).boundingBox();
  const navBox = await page.getByRole('navigation', { name: 'Pages' }).boundingBox();
  expect(friseBox.y).toBeCloseTo(navBox.y + navBox.height, 0);
  expect(friseBox.y + friseBox.height).toBeCloseTo(page.viewportSize().height, 0);
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

test('histoire : un clic sur un chapitre d\'un épisode y saute (pas au début de l\'épisode)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, la frise est dans un panneau');
  await page.goto('/');
  const frise = page.getByRole('navigation', { name: 'Frise' });
  const clickBlock = (name) => frise.getByRole('button', { name }).getByText(name, { exact: true }).click();

  await clickBlock('La royauté');
  await clickBlock("David, l'onction et Goliath");
  // En haut à gauche du bloc : la partie toujours visible d'un bloc de l'escalier
  await frise.getByRole('button', { name: /chapitre 17/ }).click({ position: { x: 20, y: 12 } });

  // 1 S 17,1 est à l'écran (et pas le début de l'épisode, en 1 S 16)
  await expect(page.getByText('Les Philistins rassemblèrent leurs armées')).toBeInViewport();
  await expect(frise.getByRole('button', { name: /chapitre 17/ })).toHaveAttribute('aria-current', 'location');
  await expect(frise.getByRole('button', { name: /chapitre 16/ })).not.toHaveAttribute('aria-current');
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

test('sur téléphone : la frise est rangée dans un panneau, ouvert par l\'onglet « Frise »', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Sur ordinateur, la frise est toujours visible');
  await page.goto('/');
  const frise = page.getByRole('navigation', { name: 'Frise' });
  await expect(page.getByRole('heading', { name: 'La Création' })).toBeVisible();
  await expect(frise).toBeHidden();

  await page.getByRole('button', { name: 'Frise' }).click();
  await expect(frise).toBeVisible();

  // Le panneau prend les 2/3 de l'écran : le tiers de droite laisse voir le texte
  const panelBox = await frise.boundingBox();
  expect(panelBox.width).toBeCloseTo(page.viewportSize().width * 2 / 3, -1);

  // Un clic sur une époque : la lecture y saute, et le panneau reste ouvert (on peut continuer à zoomer)
  await frise.getByRole('button', { name: 'Les patriarches' }).getByText('Les patriarches').click();
  await expect(page.getByRole('heading', { name: "L'appel d'Abraham" })).toBeInViewport();
  await expect(frise.getByRole('button', { name: "L'appel d'Abraham" })).toBeVisible();

  // Un toucher dans le texte (le tiers visible à droite) referme le panneau
  await page.mouse.click(page.viewportSize().width - 20, page.viewportSize().height / 2);
  await expect(frise).toBeHidden();
});
