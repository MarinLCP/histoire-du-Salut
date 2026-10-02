// Index des versets de la source (bible.db) pour les règles des fichiers de données : retrouver un verset
// par sa référence (livre, chapitre, verset), en mémoire, sans base de données.

// sourceVerses : les versets dans l'ordre de la source, [{ code, chapter, verse }, ...]
export function indexVerses(sourceVerses) {
  const positions = new Map(sourceVerses.map((verse, index) => [verseKey(verse.code, verse.chapter, verse.verse), index]));
  const bookCodes = new Set(sourceVerses.map((verse) => verse.code));

  return {
    // La position du verset dans l'ordre de la source, ou undefined s'il n'existe pas
    positionOf: (bookCode, chapter, verse) => positions.get(verseKey(bookCode, chapter, verse)),
    hasBook: (bookCode) => bookCodes.has(bookCode),
  };
}

function verseKey(bookCode, chapter, verse) {
  return `${bookCode}|${chapter}|${verse}`;
}
