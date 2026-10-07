// Règles de ce qu'un lecteur garde dans son compte (sa « bibliothèque ») : notes privées, surlignages,
// marque-pages. Fonctions pures qui vérifient ce qui arrive du navigateur ("fail fast") : une valeur fausse
// lève une ValidationError (400) avant d'atteindre la base.
// Format d'échange (le même que dans le navigateur) :
//   { notes: { "Gn 1,3": { text, updatedAt } }, highlights: { "Gn 1,3": { createdAt } },
//     bookmarks: { history: { position: 12.4, verse: null } } }

import { ValidationError } from './errors.js';
import { VerseReference } from './VerseReference.js';

const READING_MODES = ['history', 'bible'];
const MAX_NOTE_LENGTH = 10000;
// Au-delà, un envoi n'est pas celui d'un lecteur (garde-fou contre un envoi énorme)
const MAX_ITEMS = 10000;

// La clé d'un verset ("Gn 1,3"), vérifiée et réécrite telle que le site l'écrit
/** @param {unknown} text @returns {string} */
export function verseKey(text) {
  return String(VerseReference.parse(text));
}

/** @param {unknown} text @returns {string} le texte d'une note, non vide */
export function noteText(text) {
  if (typeof text !== 'string' || text.trim() === '' || text.length > MAX_NOTE_LENGTH) {
    throw new ValidationError(`Une note fait entre 1 et ${MAX_NOTE_LENGTH} caractères.`);
  }
  return text;
}

/** @param {unknown} mode @returns {'history' | 'bible'} */
export function readingMode(mode) {
  if (!READING_MODES.includes(mode)) throw new ValidationError(`Lecture « ${String(mode)} » inconnue.`);
  return mode;
}

/** @param {unknown} position @returns {number} une position de lecture (ex. 12.4) */
export function readingPosition(position) {
  if (typeof position !== 'number' || !Number.isFinite(position) || position < 0) {
    throw new ValidationError('Position de lecture invalide.');
  }
  return position;
}

// Un marque-page : { position, verse }. verse : le verset où le lecteur l'a posé à la main ("Gn 1,3"), ou null
// s'il suit la lecture. Un nombre seul (l'ancien format du navigateur) est un marque-page qui suit la lecture.
/** @param {unknown} value @returns {{ position: number, verse: string | null }} */
export function readingBookmark(value) {
  if (typeof value === 'number') return { position: readingPosition(value), verse: null };
  return { position: readingPosition(value?.position), verse: value?.verse == null ? null : verseKey(value.verse) };
}

// Une bibliothèque envoyée d'un coup (ce qui était dans le navigateur, à la première connexion), vérifiée
// et mise à plat : { notes: [{ verseKey, text, updatedAt }], highlights: [{ verseKey, createdAt }],
// bookmarks: [{ mode, position, verse }] }
export function libraryFrom({ notes = {}, highlights = {}, bookmarks = {} } = {}) {
  return {
    notes: entriesOf(notes).map(([key, note]) => ({ verseKey: verseKey(key), text: noteText(note?.text), updatedAt: date(note?.updatedAt) })),
    highlights: entriesOf(highlights).map(([key, highlight]) => ({ verseKey: verseKey(key), createdAt: date(highlight?.createdAt) })),
    bookmarks: entriesOf(bookmarks).map(([mode, bookmark]) => ({ mode: readingMode(mode), ...readingBookmark(bookmark) })),
  };
}

function entriesOf(group) {
  if (typeof group !== 'object' || group === null || Array.isArray(group)) throw new ValidationError('Format de bibliothèque invalide.');
  const entries = Object.entries(group);
  if (entries.length > MAX_ITEMS) throw new ValidationError('Trop d\'éléments envoyés d\'un coup.');
  return entries;
}

function date(text) {
  const parsed = new Date(text);
  if (typeof text !== 'string' || Number.isNaN(parsed.getTime())) throw new ValidationError('Date invalide.');
  return parsed.toISOString();
}
