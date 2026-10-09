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

test('en bas de la lecture : la navigation (qui flotte) reste visible, la frise prend toute la hauteur de l\'écran', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, la frise est dans un panneau');
  await page.goto('/');
  await page.getByRole('heading', { name: 'La Création' }).waitFor();
  await page.mouse.wheel(0, 4000);

  await expect(page.getByRole('navigation', { name: 'Pages' })).toBeInViewport();
  const friseBox = await page.getByRole('navigation', { name: 'Frise' }).boundingBox();
  const navBox = await page.getByRole('navigation', { name: 'Pages' }).boundingBox();
  // Du haut jusqu'en bas de l'écran, à gauche de la navigation (sans la chevaucher)
  expect(friseBox.y).toBeCloseTo(0, 0);
  expect(friseBox.y + friseBox.height).toBeCloseTo(page.viewportSize().height, 0);
  expect(friseBox.x + friseBox.width).toBeLessThanOrEqual(navBox.x);
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
  await page.evaluate(() => window.scrollBy(0, 200));
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
  // Le chapitre 17 a des sous-chapitres : on est descendu dedans, et le premier est celui qu'on lit
  await expect(frise.getByRole('button', { name: 'Le défi de Goliath' })).toHaveAttribute('aria-current', 'location');
});

test('sous-chapitres : un clic dans la frise amène à son intertitre dans le texte', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Sur téléphone, la frise est dans un panneau');
  await page.goto('/');
  const frise = page.getByRole('navigation', { name: 'Frise' });
  const clickBlock = (name) => frise.getByRole('button', { name }).getByText(name, { exact: true }).click();

  await clickBlock('La royauté');
  await clickBlock("David, l'onction et Goliath");
  await frise.getByRole('button', { name: /chapitre 17/ }).click({ position: { x: 20, y: 12 } });
  await frise.getByRole('button', { name: 'Le combat' }).click({ position: { x: 20, y: 12 } });

  await expect(page.getByRole('heading', { name: 'Le combat', level: 4 })).toBeInViewport();
  await expect(frise.getByRole('button', { name: 'Le combat' })).toHaveAttribute('aria-current', 'location');
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

test('reprendre sa lecture : après avoir lu, l\'app rouvre là où on en était', async ({ page }) => {
  await page.goto('/');
  // La police chargée, le texte ne bougera plus : la position lue est la bonne
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('heading', { name: "L'appel d'Abraham" }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  // L'app retient la position une fois la lecture posée
  await page.waitForTimeout(2500);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: "L'appel d'Abraham" })).toBeInViewport();
  // Pas de ruban : seul un marque-page posé à la main en a un
  await expect(page.getByRole('button', { name: /Aller au marque-page/ })).toHaveCount(0);

  // Par un lien (ici, un passage partagé), on va où le lien mène
  await page.goto('/?passage=creation');
  await expect(page.getByRole('heading', { name: 'La Création' })).toBeInViewport();
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
  // La navigation du haut s'efface ; les onglets tiennent dans le panneau, leur texte dans sa pastille
  await expect(page.getByRole('button', { name: 'Mon compte' })).toBeHidden();
  // (mesuré d'un coup, dans la page : le panneau peut encore glisser)
  const tabsFit = await frise.evaluate((nav) => [...nav.querySelectorAll('.frise-tabs button')].every((tab) =>
    tab.getBoundingClientRect().right <= nav.getBoundingClientRect().right && tab.scrollWidth <= tab.clientWidth));
  expect(tabsFit).toBe(true);

  // Un clic sur une époque : la lecture y saute, et le panneau reste ouvert (on peut continuer à zoomer)
  await frise.getByRole('button', { name: 'Les patriarches' }).getByText('Les patriarches').click();
  await expect(page.getByRole('heading', { name: "L'appel d'Abraham" })).toBeInViewport();
  await expect(frise.getByRole('button', { name: "L'appel d'Abraham" })).toBeVisible();

  // Un toucher dans le texte (le tiers visible à droite) referme le panneau
  await page.mouse.click(page.viewportSize().width - 20, page.viewportSize().height / 2);
  await expect(frise).toBeHidden();
  await expect(page.getByRole('button', { name: 'Mon compte' })).toBeVisible();

  // Le panneau n'a pas de fond : un toucher à côté des blocs (en haut à droite de l'escalier) le referme aussi
  await page.getByRole('button', { name: 'Frise' }).click();
  await expect(frise).toBeVisible();
  const tabsBox = await frise.getByRole('group', { name: 'Niveau de la frise' }).boundingBox();
  await page.mouse.click(page.viewportSize().width * 2 / 3 - 8, tabsBox.y + tabsBox.height + 20);
  await expect(frise).toBeHidden();
});
