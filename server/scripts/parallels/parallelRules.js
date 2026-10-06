// Met en correspondance les liens du fichier des parallèles avec les versets de la Bible AELF :
// chaque référence est convertie (versification.js) puis cherchée dans la source (bible.db).
// Un lien dont une référence ne correspond à rien est mis de côté, avec la raison : le seed refuse
// d'écrire les parallèles tant qu'il en reste un (correspondance à 100 %).
// Une plage peut passer d'un livre au suivant (ex. 2 Ch 36,22 – Esd 1,3) : elle doit seulement aller dans
// l'ordre de la Bible. Deux liens que la conversion rend identiques (versets fusionnés dans l'AELF)
// n'en font qu'un, avec le plus grand nombre de votes.

import { indexVerses } from '../verseIndex.js';
import { toAelf } from './versification.js';

/**
 * @param {Array<{ from: object, to: { start: object, end: object }, votes: number }>} links (crossReferences.js)
 * @param {Array<{ code: string, chapter: string, verse: string }>} readingVerses les versets de bible.db, dans
 *   l'ordre de lecture du site (Psaumes après Job : bibleOrder.js), celui de la base
 * @returns {{ parallels: Array<{ from, toStart, toEnd, votes }>, unmatched: Array<{ link, reason }> }}
 *   (références : des VerseReference)
 */
export function matchParallels(links, readingVerses) {
  const index = indexVerses(readingVerses);
  const parallels = new Map();
  const unmatched = [];

  for (const link of links) {
    const parallel = toAelfParallel(link);
    const reason = problemWith(parallel, index);
    if (reason) {
      unmatched.push({ link, reason });
      continue;
    }
    keepMostVoted(parallels, parallel);
  }
  return { parallels: [...parallels.values()], unmatched };
}

// Le seed s'arrête si un seul lien ne correspond pas (correspondance à 100 % exigée)
export function requireFullMatch(unmatched) {
  if (unmatched.length === 0) return;
  throw new Error(`${unmatched.length} parallèle(s) sans verset AELF (ex. ${unmatched[0].reason}). `
    + 'Détail : npm run parallels:report');
}

function toAelfParallel({ from, to, votes }) {
  return { from: toAelf(from), toStart: toAelf(to.start), toEnd: toAelf(to.end), votes };
}

function keepMostVoted(parallels, parallel) {
  const key = `${parallel.from} | ${parallel.toStart} | ${parallel.toEnd}`;
  const existing = parallels.get(key);
  if (existing && existing.votes >= parallel.votes) return;
  parallels.set(key, parallel);
}

function problemWith({ from, toStart, toEnd }, index) {
  const references = [from, toStart, toEnd];
  const positions = references.map(({ book, chapter, verse }) => index.positionOf(book, chapter, verse));
  const missing = positions.indexOf(undefined);
  if (missing !== -1) return `verset introuvable : ${references[missing]}`;
  const [, startPosition, endPosition] = positions;
  if (startPosition > endPosition) return `plage à l'envers : ${toStart} – ${toEnd}`;
  return null;
}
