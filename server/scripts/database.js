// Connexion et transactions des scripts (seed, migrations) : écrites une seule fois.

import pg from 'pg';

// DATABASE_URL vient du fichier .env (chargé par node --env-file)
const connect = () => new pg.Client({ connectionString: process.env.DATABASE_URL });

// Ouvre une connexion, fait le travail, et la ferme TOUJOURS (même en cas d'erreur :
// sinon le script ne s'arrête pas). newClient : remplacé par un faux client dans les tests.
export async function withClient(work, newClient = connect) {
  const client = newClient();
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

// Une transaction (tout ou rien) : la même que l'API, écrite une seule fois
export { inTransaction } from '../src/infrastructure/transaction.js';
