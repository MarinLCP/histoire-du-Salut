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
 * @param {Array<{ code: string, chapter: string, verse: string }>} sourceVerses les versets de bible.db
 * @returns {{ parallels: Array<{ from, toStart, toEnd, votes }>, unmatched: Array<{ link, reason }> }}
 */
export function matchParallels(links, sourceVerses) {
  const index = indexVerses(sourceVerses);
  const parallels = new Map();
  const unmatched = [];

  for (const link of links) {
    const parallel = { from: toAelf(link.from), toStart: toAelf(link.to.start), toEnd: toAelf(link.to.end), votes: link.votes };
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

function keepMostVoted(parallels, parallel) {
  const key = [parallel.from, parallel.toStart, parallel.toEnd].map(written).join(' | ');
  const existing = parallels.get(key);
  if (existing && existing.votes >= parallel.votes) return;
  parallels.set(key, parallel);
}

function problemWith({ from, toStart, toEnd }, index) {
  const missing = [from, toStart, toEnd].find((reference) => positionOf(reference, index) === undefined);
  if (missing) return `verset introuvable : ${written(missing)}`;
  if (positionOf(toStart, index) > positionOf(toEnd, index)) return `plage à l'envers : ${written(toStart)} – ${written(toEnd)}`;
  return null;
}

function positionOf({ book, chapter, verse }, index) {
  return index.positionOf(book, chapter, verse);
}

// { book: 'Gn', chapter: '32', verse: 2 } -> "Gn 32,2"
export function written({ book, chapter, verse }) {
  return `${book} ${chapter},${verse}`;
}
