// Parcours : l'application (PWA). Le site est installable : un manifeste relié à la page (nom, plein écran,
// icônes qui existent vraiment) et l'icône de l'iPhone.

import { test, expect } from '@playwright/test';

test('installable : le manifeste (nom, plein écran) et toutes ses icônes ; l\'icône de l\'iPhone', async ({ page }) => {
  await page.goto('/');
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await page.request.get(manifestUrl)).json();

  expect(manifest).toMatchObject({ name: 'L\'histoire d\'un Salut', start_url: '/', display: 'standalone' });
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).status(), icon.src).toBe(200);
  const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect((await page.request.get(appleIcon)).status()).toBe(200);
});
