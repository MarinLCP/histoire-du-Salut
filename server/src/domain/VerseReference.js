// Value object : la référence d'un verset dans la Bible AELF (livre, chapitre, verset), ex. Gn 32,2.
// Chapitre et verset sont du texte, comme dans la base ("9A", "1a"). Immuable et toujours complète
// (vérification dès la création, "fail fast"). Son texte ("Gn 32,2") est le même que dans le site :
// il sert aussi de clé. Utilisée par l'API (parallèles d'un verset) ET par le seed (parallèles).

import { ValidationError } from './errors.js';

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

  toString() {
    return `${this.book} ${this.chapter},${this.verse}`;
  }
}
