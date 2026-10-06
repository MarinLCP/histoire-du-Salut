// Rapport de correspondance des parallèles (OpenBible.info) avec la Bible AELF, avant de les écrire en base.
// Lit data/cross-references.zip et data/bible.db, convertit chaque lien et liste ceux qui ne correspondent
// à aucun verset. Sort en erreur (code 1) s'il en reste un : l'objectif est une correspondance à 100 %.
// Lancer : npm run parallels:report

import { readBibleSource } from './bibleSource.js';
import { readParallelLinks } from './parallels/parallelsFile.js';
import { matchParallels } from './parallels/parallelRules.js';

const SHOWN_PROBLEMS = 30;

const links = readParallelLinks();
const { parallels, unmatched } = matchParallels(links, readBibleSource().verses);

console.log(`${links.length} liens lus, ${links.length - unmatched.length} en correspondance, ${unmatched.length} mis de côté`
  + ` (${parallels.length} parallèles une fois les doublons fusionnés).`);
for (const { reason } of unmatched.slice(0, SHOWN_PROBLEMS)) console.log(`  - ${reason}`);
if (unmatched.length > 0) process.exit(1);

