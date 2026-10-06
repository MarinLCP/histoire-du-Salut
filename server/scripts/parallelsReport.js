// Rapport de correspondance des parallèles (OpenBible.info) avec la Bible AELF, avant de les écrire en base.
// Lit data/cross-references.zip et data/bible.db, convertit chaque lien et liste ceux qui ne correspondent
// à aucun verset. Sort en erreur (code 1) s'il en reste un : l'objectif est une correspondance à 100 %.
// Lancer : npm run parallels:report

import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { readSingleFileZip } from './parallels/zipFile.js';
import { parseCrossReferences } from './parallels/crossReferences.js';
import { matchParallels } from './parallels/parallelRules.js';

const ZIP_PATH = fileURLToPath(new URL('../data/cross-references.zip', import.meta.url));
const SOURCE_PATH = fileURLToPath(new URL('../data/bible.db', import.meta.url));
const SHOWN_PROBLEMS = 30;

const links = parseCrossReferences(readSingleFileZip(readFileSync(ZIP_PATH)).text);
const { parallels, unmatched } = matchParallels(links, readSourceVerses());

console.log(`${links.length} liens lus, ${parallels.length} en correspondance, ${unmatched.length} mis de côté.`);
for (const { reason } of unmatched.slice(0, SHOWN_PROBLEMS)) console.log(`  - ${reason}`);
if (unmatched.length > 0) process.exit(1);

function readSourceVerses() {
  const database = new DatabaseSync(SOURCE_PATH, { readOnly: true });
  const verses = database.prepare('SELECT book AS code, chapter, verse FROM verses ORDER BY rowid').all();
  database.close();
  return verses;
}
