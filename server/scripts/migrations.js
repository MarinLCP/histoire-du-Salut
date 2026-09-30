// Règles des migrations : fonction pure (pas de base de données), testée dans test/migrations.test.js.

// Un fichier de migration : 3 chiffres, un tiret bas, un nom, .sql (ex. "002_add_slug.sql")
const MIGRATION_FILE = /^(\d{3})_[a-z0-9_]+\.sql$/;

// files : les fichiers du dossier migrations/ ; applied : les noms déjà appliqués à la base.
// Renvoie les migrations à appliquer, dans l'ordre de leur numéro.
export function pendingMigrations(files, applied) {
  const migrations = files.filter((file) => MIGRATION_FILE.test(file)).sort();
  requireUniqueNumbers(migrations);

  const alreadyApplied = new Set(applied);
  return migrations.filter((migration) => !alreadyApplied.has(migration));
}

// Deux migrations "002_..." : l'ordre serait ambigu, on refuse
function requireUniqueNumbers(migrations) {
  const numbers = migrations.map((migration) => migration.slice(0, 3));
  const duplicate = numbers.find((number, index) => numbers.indexOf(number) !== index);

  if (duplicate) {
    throw new Error(`Deux migrations portent le numéro ${duplicate} : renomme l'une d'elles.`);
  }
}
