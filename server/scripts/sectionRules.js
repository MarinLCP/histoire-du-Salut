// Règles des sous-chapitres (db/sections.data.js) : fonction pure, appelée par le seed AVANT de toucher
// à la base. Un sous-chapitre = un intertitre posé sur le verset où il commence.

import { indexVerses } from './verseIndex.js';
import { validateStatus } from './dataStatus.js';

// sourceVerses : les versets de la source, [{ code, chapter, verse }, ...]. Lève une erreur au premier problème.
export function validateSections(sections, sourceVerses) {
  const index = indexVerses(sourceVerses);
  const starts = new Set();

  for (const section of sections) {
    const where = `Sous-chapitre "${section.title}"`;
    validateSection(section, where, index);
    const start = `${section.book} ${section.start[0]},${section.start[1]}`;
    if (starts.has(start)) throw new Error(`${where} : un autre sous-chapitre commence déjà en ${start}.`);
    starts.add(start);
  }
}

function validateSection(section, where, index) {
  validateStatus(section, where);
  if (section.title.trim() === '') throw new Error(`${where} : titre vide.`);

  const [chapter, verse] = section.start;
  if (index.positionOf(section.book, chapter, verse) === undefined) {
    throw new Error(`${where} : ${section.book} ${chapter},${verse} introuvable.`);
  }
}
