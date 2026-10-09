// Règles de ce qu'un lecteur garde dans son compte (sa « bibliothèque ») : notes privées, surlignages,
// marque-pages posés à la main, et où il en est dans chaque lecture. Fonctions pures qui vérifient ce qui arrive
// du navigateur ("fail fast") : une valeur fausse lève une ValidationError (400) avant d'atteindre la base.
// Format d'échange (le même que dans le navigateur) :
//   { notes: { "Gn 1,3": { text, updatedAt } }, highlights: { "Gn 1,3": { createdAt } },
//     bookmarks: { history: { position: 12.4, verse: "Gn 3,15" } },
//     readings: { history: { position: 14.2, savedAt } } }

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

// Un marque-page, posé à la main sur un verset : { position, verse: "Gn 1,3" }
/** @param {unknown} value @returns {{ position: number, verse: string }} */
export function readingBookmark(value) {
  return { position: readingPosition(value?.position), verse: verseKey(value?.verse) };
}

// Une bibliothèque envoyée d'un coup (ce qui était dans le navigateur, à la première connexion), vérifiée
// et mise à plat : { notes: [{ verseKey, text, updatedAt }], highlights: [{ verseKey, createdAt }],
// bookmarks: [{ mode, position, verse }], readings: [{ mode, position, savedAt }] }.
// Un marque-page sans verset vient d'une version plus ancienne de l'app (il suivait la lecture) : ignoré
export function libraryFrom({ notes = {}, highlights = {}, bookmarks = {}, readings = {} } = {}) {
  return {
    notes: entriesOf(notes).map(([key, note]) => ({ verseKey: verseKey(key), text: noteText(note?.text), updatedAt: date(note?.updatedAt) })),
    highlights: entriesOf(highlights).map(([key, highlight]) => ({ verseKey: verseKey(key), createdAt: date(highlight?.createdAt) })),
    bookmarks: entriesOf(bookmarks).filter(([, bookmark]) => bookmark?.verse != null)
      .map(([mode, bookmark]) => ({ mode: readingMode(mode), ...readingBookmark(bookmark) })),
    readings: entriesOf(readings).map(([mode, reading]) => ({
      mode: readingMode(mode), position: readingPosition(reading?.position), savedAt: date(reading?.savedAt),
    })),
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
