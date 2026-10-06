// Une transaction : soit tout le travail est enregistré (COMMIT), soit rien (ROLLBACK), et l'erreur remonte.
// Partagée par l'API (fusion d'une bibliothèque) et par les scripts (seed). client : une connexion pg.

export async function inTransaction(client, work) {
  await client.query('BEGIN');
  try {
    await work();
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
