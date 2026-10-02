// Parcours : les personnages d'un épisode (calculés par le seed ; en local et en CI, les propositions sont
// dans la base).

import { test, expect } from '@playwright/test';

test('un épisode montre ses personnages sous sa référence', async ({ page }) => {
  await page.goto('/?passage=appel-abraham');

  // Le premier affiché : celui de l'épisode ouvert par le lien (les suivants parlent aussi d'Abraham)
  await expect(page.getByText(/^Personnages : .*Abraham/).first()).toBeVisible();
});
