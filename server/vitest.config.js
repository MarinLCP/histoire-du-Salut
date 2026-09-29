import { defineConfig } from 'vitest/config';

// Charge le fichier .env (DATABASE_URL) avant les tests, comme node --env-file
process.loadEnvFile();

export default defineConfig({});
