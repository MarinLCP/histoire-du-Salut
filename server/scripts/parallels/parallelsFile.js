// Lit les liens du fichier des parallèles (data/cross-references.zip, OpenBible.info, CC-BY),
// directement dans le ZIP. Sert au seed et au rapport de correspondance.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readSingleFileZip } from './zipFile.js';
import { parseCrossReferences } from './crossReferences.js';

const ZIP_PATH = fileURLToPath(new URL('../../data/cross-references.zip', import.meta.url));

export function readParallelLinks() {
  return parseCrossReferences(readSingleFileZip(readFileSync(ZIP_PATH)));
}
