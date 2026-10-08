// Gestes et repères communs aux parcours.

import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
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

// Ouvre le panneau « Compte et réglages » (bouton « personne ») ; renvoie sa section « Mon compte »
export async function openAccount(page) {
  await page.getByRole('button', { name: 'Mon compte' }).click();
  return page.getByRole('region', { name: 'Mon compte' });
}

// Tape le code reçu par e-mail à cette adresse dans `scope` (la section « Mon compte » ou le menu d'un verset),
// puis le valide
export async function enterEmailCode(page, scope, email) {
  await scope.getByLabel('Code reçu par e-mail').fill(await emailCode(page, email));
  await scope.getByRole('button', { name: 'Valider' }).click();
}

// Une adresse que personne d'autre n'utilise, même si plusieurs tests démarrent à la même milliseconde
// (Date.now() ne suffisait pas : deux tests sur la même adresse s'écrasaient leur code de validation)
export function uniqueEmail(prefix) {
  return `${prefix}-${randomUUID()}@exemple.test`;
}

// Le code de validation envoyé à cette adresse (boîte de test du serveur, EMAIL_OUTBOX=1). On attend que
// l'e-mail soit parti : le serveur répond au clic avant ou après l'envoi, selon la vitesse. Jusqu'à 10 s :
// quand tous les parcours tournent ensemble, chaque création de compte hache un mot de passe (exprès lent)
export async function emailCode(page, email) {
  const latest = () => page.request.get(`/api/test/emails/latest?to=${encodeURIComponent(email)}`);
  await expect.poll(async () => (await latest()).status(), { timeout: 10000 }).toBe(200);
  const { subject } = await (await latest()).json();
  return subject.match(/\d{6}/)[0];
}

// Un compte créé et validé par l'API (sans passer par l'écran), connecté dans ce navigateur
export async function createAccountByApi(page, email, password) {
  await page.request.post('/api/account', { data: { email, password } });
  await page.request.post('/api/account/verify', { data: { email, password, code: await emailCode(page, email) } });
}
