// Applique à la base les migrations de db/migrations/ qui ne l'ont pas encore été.
// La table schema_migrations retient celles déjà appliquées : relancer ce script ne rejoue rien.
// Usage : npm run db:migrate

import { readdir, readFile } from 'node:fs/promises';
import { pendingMigrations } from './migrations.js';
import { withClient, inTransaction } from './database.js';

const MIGRATIONS_DIRECTORY = new URL('../db/migrations/', import.meta.url);

await withClient(async (client) => {
  await createMigrationsTable(client);
  const toApply = pendingMigrations(await readdir(MIGRATIONS_DIRECTORY), await appliedMigrations(client));

  for (const migration of toApply) {
    await applyMigration(client, migration);
  }
  console.log(toApply.length === 0 ? 'Base à jour : aucune migration à appliquer.' : 'Migrations terminées.');
});

async function createMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function appliedMigrations(client) {
  const result = await client.query('SELECT name FROM schema_migrations');
  return result.rows.map((row) => row.name);
}

// Une transaction par migration : si elle échoue au milieu, rien n'est appliqué ni noté
async function applyMigration(client, migration) {
  const sql = await readFile(new URL(migration, MIGRATIONS_DIRECTORY), 'utf8');

  await inTransaction(client, async () => {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration]);
  }).catch((error) => {
    throw new Error(`La migration ${migration} a échoué : ${error.message}`);
  });
  console.log(`Appliquée : ${migration}`);
}
