// Règles qu'une liste de passages (db/passages.data.js) doit respecter avant d'être enregistrée.
// Fonction pure : on lui donne les versets de la source en mémoire, sans base de données.
// Le seed s'en sert pour s'arrêter AVANT de toucher à la base, avec un message clair.

import { PassageSlug } from '../src/domain/PassageSlug.js';
import { isDataIdentifier } from './dataIdentifier.js';

// sourceVerses : les versets dans l'ordre de lecture, [{ code, chapter, verse }, ...]
// Lève une erreur au premier passage incorrect.
export function validatePassages(passages, sourceVerses) {
  const positions = versePositions(sourceVerses);
  const bookCodes = new Set(sourceVerses.map((verse) => verse.code));

  for (const passage of passages) {
    validatePassage(passage, bookCodes, positions);
  }
}

function validatePassage(passage, bookCodes, positions) {
  // La même règle que l'API pour le slug (lève une ValidationError)
  new PassageSlug(passage.slug);

  if (!isDataIdentifier(passage.icon)) {
    throw new Error(`Passage "${passage.title}" : pictogramme "${passage.icon}" mal formé.`);
  }

  if (!bookCodes.has(passage.book)) {
    throw new Error(`Passage "${passage.title}" : livre ${passage.book} introuvable.`);
  }

  const startPosition = requirePosition(passage, passage.start, positions);
  const endPosition = requirePosition(passage, passage.end, positions);

  if (startPosition > endPosition) {
    throw new Error(`Passage "${passage.title}" : le début est après la fin.`);
  }
}

// La position (ordre de lecture) du verset [chapitre, verset] du livre du passage
function requirePosition(passage, [chapter, verse], positions) {
  const position = positions.get(referenceKey(passage.book, chapter, verse));

  if (position === undefined) {
    throw new Error(`Passage "${passage.title}" : ${passage.book} ${chapter},${verse} introuvable.`);
  }
  return position;
}

// Map : "Gn|1|3" -> position du verset dans l'ordre de lecture
function versePositions(sourceVerses) {
  return new Map(
    sourceVerses.map((verse, index) => [referenceKey(verse.code, verse.chapter, verse.verse), index]),
  );
}

function referenceKey(bookCode, chapter, verse) {
  return `${bookCode}|${chapter}|${verse}`;
}
