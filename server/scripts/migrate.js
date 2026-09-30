// Applique à la base les migrations de db/migrations/ qui ne l'ont pas encore été.
// La table schema_migrations retient celles déjà appliquées : relancer ce script ne rejoue rien.
// Usage : npm run db:migrate

import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import { pendingMigrations } from './migrations.js';

const MIGRATIONS_DIRECTORY = new URL('../db/migrations/', import.meta.url);

// DATABASE_URL vient du fichier .env (chargé par node --env-file)
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await createMigrationsTable();
  const toApply = pendingMigrations(await readdir(MIGRATIONS_DIRECTORY), await appliedMigrations());

  for (const migration of toApply) {
    await applyMigration(migration);
  }
  console.log(toApply.length === 0 ? 'Base à jour : aucune migration à appliquer.' : 'Migrations terminées.');
} finally {
  // On ferme la connexion même en cas d'erreur, sinon le script ne s'arrête pas
  await client.end();
}

async function createMigrationsTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function appliedMigrations() {
  const result = await client.query('SELECT name FROM schema_migrations');
  return result.rows.map((row) => row.name);
}

// Une transaction par migration : si elle échoue au milieu, rien n'est appliqué ni noté
async function applyMigration(migration) {
  const sql = await readFile(new URL(migration, MIGRATIONS_DIRECTORY), 'utf8');

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration]);
    await client.query('COMMIT');
    console.log(`Appliquée : ${migration}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`La migration ${migration} a échoué : ${error.message}`);
  }
}
