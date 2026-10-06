// Les Psaumes : le fichier des parallèles suit la numérotation hébraïque (Bibles protestantes), l'AELF la
// numérotation grecque des chapitres (Ps 9 et 10 n'en font qu'un, 9A et 9B, etc.). De plus, l'AELF compte
// le titre d'un psaume (« Psaume de David ») comme ses premiers versets, les Bibles protestantes non.

// Les psaumes dont le titre occupe un verset (ou deux) dans l'AELF, en numérotation hébraïque
const ONE_TITLE_VERSE = new Set([3, 4, 5, 6, 7, 8, 9, 12, 18, 19, 20, 21, 22, 30, 31, 34, 36, 38, 39, 40, 41, 42,
  44, 45, 46, 47, 48, 49, 53, 55, 56, 57, 58, 59, 61, 62, 63, 64, 65, 67, 68, 69, 70, 75, 76, 77, 80, 81, 83, 84,
  85, 88, 89, 92, 102, 108, 140, 142]);
const TWO_TITLE_VERSES = new Set([51, 52, 54, 60]);

// Les chapitres dont le nom AELF n'est pas un simple décalage
const NAMED_CHAPTERS = { 9: '9A', 10: '9B', 114: '113A', 115: '113B' };

// Ps 116 et 147 sont coupés en deux psaumes dans l'AELF (les numéros de versets ne changent pas)
const SPLIT_CHAPTERS = { 116: { lastVerse: 9, first: '114', second: '115' }, 147: { lastVerse: 11, first: '146', second: '147' } };

/**
 * @param {number} chapter numéro hébraïque
 * @param {number} verse numéro des Bibles protestantes
 * @returns {{ chapter: string, verse: number }} la place du verset dans l'AELF
 */
export function psalmToAelf(chapter, verse) {
  // Ps 13,5-6 : l'AELF n'en fait qu'un verset (Ps 12,6)
  if (chapter === 13) return { chapter: '12', verse: Math.min(verse + 1, 6) };
  // Ps 72,20 (« Fin des prières de David ») n'est pas dans l'AELF : on le rattache au dernier verset
  if (chapter === 72 && verse === 20) return { chapter: '71', verse: 19 };
  return { chapter: aelfChapter(chapter, verse), verse: verse + titleVerses(chapter) };
}

function aelfChapter(chapter, verse) {
  const split = SPLIT_CHAPTERS[chapter];
  if (split) return verse <= split.lastVerse ? split.first : split.second;
  if (NAMED_CHAPTERS[chapter]) return NAMED_CHAPTERS[chapter];
  // Ps 1-8 et 148-150 gardent leur numéro ; entre les deux, l'AELF a un psaume de retard
  if (chapter <= 8 || chapter >= 148) return String(chapter);
  return String(chapter - 1);
}

function titleVerses(chapter) {
  if (TWO_TITLE_VERSES.has(chapter)) return 2;
  if (ONE_TITLE_VERSE.has(chapter)) return 1;
  return 0;
}
