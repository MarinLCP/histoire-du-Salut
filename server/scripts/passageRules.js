// Règles qu'une liste de passages (db/passages.data.js) doit respecter avant d'être enregistrée.
// Fonction pure : on lui donne les versets de la source en mémoire, sans base de données.
// Le seed s'en sert pour s'arrêter AVANT de toucher à la base, avec un message clair.

import { PassageSlug } from '../src/domain/PassageSlug.js';
import { isIdentifier } from '../src/domain/identifier.js';
import { indexVerses } from './verseIndex.js';

// sourceVerses : les versets dans l'ordre de lecture, [{ code, chapter, verse }, ...]
// Lève une erreur au premier passage incorrect.
export function validatePassages(passages, sourceVerses) {
  const index = indexVerses(sourceVerses);

  for (const passage of passages) {
    validatePassage(passage, index);
  }
}

function validatePassage(passage, index) {
  // La même règle que l'API pour le slug (lève une ValidationError)
  new PassageSlug(passage.slug);

  if (!isIdentifier(passage.icon)) {
    throw new Error(`Passage "${passage.title}" : pictogramme "${passage.icon}" mal formé.`);
  }

  if (!index.hasBook(passage.book)) {
    throw new Error(`Passage "${passage.title}" : livre ${passage.book} introuvable.`);
  }

  const startPosition = requirePosition(passage, passage.start, index);
  const endPosition = requirePosition(passage, passage.end, index);

  if (startPosition > endPosition) {
    throw new Error(`Passage "${passage.title}" : le début est après la fin.`);
  }
}

// La position (ordre de lecture) du verset [chapitre, verset] du livre du passage
function requirePosition(passage, [chapter, verse], index) {
  const position = index.positionOf(passage.book, chapter, verse);

  if (position === undefined) {
    throw new Error(`Passage "${passage.title}" : ${passage.book} ${chapter},${verse} introuvable.`);
  }
  return position;
}
