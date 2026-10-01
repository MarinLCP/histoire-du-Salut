// Tests de bout en bout (E2E) : un vrai navigateur rejoue des parcours d'utilisateur
// sur l'app complète EN LOCAL (site Vite + API + base de dev). Jamais sur le site en ligne.
// Usage : npm test (la base de dev doit être remplie : cd ../server && npm run seed)

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Chaque test a son propre navigateur "neuf" (localStorage vide) : ils peuvent tourner en parallèle
  fullyParallel: true,
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

  // Démarre l'API et le site s'ils ne tournent pas déjà (sinon, réutilise ceux qui tournent)
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../server',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev',
      cwd: '../client',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
  ],
});
