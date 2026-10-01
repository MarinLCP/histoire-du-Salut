import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Charge le fichier .env (DATABASE_URL) avant les tests, comme node --env-file.
// En CI (GitHub Actions), il n'y a pas de .env : DATABASE_URL est donnée par le workflow.
if (existsSync('.env')) process.loadEnvFile();

export default defineConfig({});
