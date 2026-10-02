// Gestes et repères communs aux parcours.

import { test } from '@playwright/test';
import { LONG_PRESS_DELAY } from '../../client/src/hooks/longPress.js';

// Le premier verset de la Création (Gn 1,1), trouvé par son texte comme le ferait un utilisateur
export function firstVerse(page) {
  return page.getByRole('button', { name: /AU COMMENCEMENT/ });
}

// Appui long : on appuie, on attend un peu plus que la durée de l'app, on relâche
export async function longPress(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  await page.mouse.move(box.x + 30, box.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(LONG_PRESS_DELAY + 200);
  await page.mouse.up();
}

// Fait défiler jusqu'en bas de la page, comme un pouce qui scrolle
export async function scrollToBottom(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

// Défile jusqu'à ce que `locator` soit visible (garde-fou : au plus `maxAttempts` défilements)
export async function scrollUntilVisible(page, locator, maxAttempts = 50) {
  for (let attempt = 0; attempt < maxAttempts && !(await locator.isVisible()); attempt++) {
    await scrollToBottom(page);
    await page.waitForTimeout(300);
  }
}

// Le titre du premier passage affiché
export function firstTitle(page) {
  return page.getByRole('heading', { level: 2 }).first();
}

// Le presse-papiers ne se lit depuis un test que dans Chromium : on saute le test ailleurs
export async function allowClipboard(context, browserName) {
  test.skip(browserName !== 'chromium', 'Lecture du presse-papiers impossible dans WebKit');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
}

export function readClipboard(page) {
  return page.evaluate(() => navigator.clipboard.readText());
}
