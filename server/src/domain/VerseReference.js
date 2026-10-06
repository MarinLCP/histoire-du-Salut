// Value object : la référence d'un verset dans la Bible AELF (livre, chapitre, verset), ex. Gn 32,2.
// Chapitre et verset sont du texte, comme dans la base ("9A", "1a"). Immuable et toujours complète
// (vérification dès la création, "fail fast"). Son texte ("Gn 32,2") est le même que dans le site :
// il sert aussi de clé. Utilisée par l'API (parallèles d'un verset, notes et surlignages d'un compte) ET par
// le seed (parallèles).

import { ValidationError } from './errors.js';

// "Gn 1,3", "Ps 9A,1a", "1S 17,4" : un livre, une espace, le chapitre, une virgule, le verset
const WRITTEN_FORMAT = /^(\S+) ([^\s,]+),(\S+)$/;
// Bien au-delà de la plus longue référence réelle : une valeur plus longue est forcément fausse
const MAX_WRITTEN_LENGTH = 40;

export class VerseReference {
  /** @param {string} book - le code du livre (ex. "Gn") @param {string} chapter @param {string} verse */
  constructor(book, chapter, verse) {
    if (!book || !chapter || !verse) throw new ValidationError('Référence de verset incomplète.');
    this.book = book;
    this.chapter = chapter;
    this.verse = verse;
    Object.freeze(this);
  }

  // Depuis des valeurs reçues d'ailleurs (paramètres d'adresse, conversion des parallèles en nombres)
  /** @param {{ book: string, chapter: string | number, verse: string | number }} parts @returns {VerseReference} */
  static from({ book, chapter, verse }) {
    return new VerseReference(book, String(chapter), String(verse));
  }

  // Depuis son texte ("Gn 1,3", ex. la clé d'une note envoyée par le navigateur), ou ValidationError
  /** @param {unknown} text @returns {VerseReference} */
  static parse(text) {
    const match = typeof text === 'string' && text.length <= MAX_WRITTEN_LENGTH ? WRITTEN_FORMAT.exec(text) : null;
    if (!match) throw new ValidationError(`Référence de verset « ${String(text).slice(0, MAX_WRITTEN_LENGTH)} » illisible.`);
    const [, book, chapter, verse] = match;
    return new VerseReference(book, chapter, verse);
  }

  toString() {
    return `${this.book} ${this.chapter},${this.verse}`;
  }
}
