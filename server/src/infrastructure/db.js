// Connexion à PostgreSQL, partagée par toute l'API.

import pg from 'pg';

// Un pool garde plusieurs connexions ouvertes et les prête aux requêtes :
// plus rapide que d'ouvrir une connexion à chaque appel.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Vérifie que la base répond, avec la plus petite requête possible (utilisé par /api/health)
export async function pingDatabase() {
  await pool.query('SELECT 1');
}
