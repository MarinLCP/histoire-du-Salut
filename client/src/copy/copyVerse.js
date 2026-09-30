// Texte copié quand on copie un verset : fonction pure, facile à tester.

// Espace insécable : en français, elle colle les guillemets au texte (jamais de retour à la ligne entre les deux)
const NO_BREAK_SPACE = '\u00a0';

export function formatVerseForCopy(verseKey, text) {
  return `«${NO_BREAK_SPACE}${text}${NO_BREAK_SPACE}» (${verseKey})`;
}
