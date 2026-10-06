// Tests de bout en bout (E2E) : un vrai navigateur rejoue des parcours d'utilisateur
// sur l'app complète EN LOCAL (site Vite + API + base de dev). Jamais sur le site en ligne.
// Usage : npm test (la base de dev doit être remplie : cd ../server && npm run seed)
// Tourne aussi dans la CI (job e2e de .github/workflows/ci.yml) : GitHub y fournit la variable CI.

import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  // Chaque test a son propre navigateur "neuf" (localStorage vide) : ils peuvent tourner en parallèle
  fullyParallel: true,
  // En CI : un test.only oublié ferait croire que tout passe alors qu'un seul test a tourné
  forbidOnly: isCI,
  // En CI : un test qui échoue est relancé une fois ; s'il passe, il est marqué "flaky" (instable, à corriger)
  retries: isCI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    // En cas d'échec, Playwright garde une trace (captures, réseau...) : npm run report pour la voir
    trace: 'retain-on-failure',
  },

  // Les mêmes parcours, sur deux appareils
  projects: [
    { name: 'ordinateur (Chrome)', use: { ...devices['Desktop Chrome'] } },
    { name: 'iPhone (Safari)', use: { ...devices['iPhone 14'] } },
  ],

  // Démarre l'API et le site. En local, réutilise ceux qui tournent déjà ; en CI, démarre toujours les siens
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../server',
      // Les e-mails (codes de validation) restent dans une boîte de test que les parcours lisent
      // (/api/test/emails/latest) ; jamais en ligne (voir chooseEmailSender, server/src/app.js)
      env: { EMAIL_OUTBOX: '1' },
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !isCI,
    },
    {
      command: 'npm run dev',
      cwd: '../client',
      url: 'http://localhost:5173',
      reuseExistingServer: !isCI,
    },
  ],
});
