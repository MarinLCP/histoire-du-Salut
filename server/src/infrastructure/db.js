// Connexion à PostgreSQL, partagée par toute l'API.

import pg from 'pg';

// Un pool garde plusieurs connexions ouvertes et les prête aux requêtes :
// plus rapide que d'ouvrir une connexion à chaque appel.
// jit=off : nos requêtes sont courtes, mais l'estimation de la marge (une sous-requête par verset) dépasse
// le seuil où PostgreSQL compile la requête en code machine (JIT, LLVM) : ~1 s de compilation à chaque appel
// en CI et sur Render (le Postgres.app du Mac n'a pas de JIT, d'où des tests rapides en local).
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, options: '-c jit=off' });

// Vérifie que la base répond, avec la plus petite requête possible (utilisé par /api/health)
export async function pingDatabase() {
  await pool.query('SELECT 1');
}
