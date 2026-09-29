// Crée les tables de la base à partir de db/schema.sql.
// Usage : npm run db:schema

import { readFile } from 'node:fs/promises';
import pg from 'pg';

const schemaUrl = new URL('../db/schema.sql', import.meta.url);
const schema = await readFile(schemaUrl, 'utf8');

// DATABASE_URL vient du fichier .env (chargé par node --env-file)
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

try {
  await client.query(schema);
  console.log('Schéma créé : tables books, verses et passages.');
} finally {
  // On ferme la connexion même en cas d'erreur, sinon le script ne s'arrête pas
  await client.end();
}
