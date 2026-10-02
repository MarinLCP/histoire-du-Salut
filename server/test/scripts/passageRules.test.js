// Tests des règles qu'une liste de passages (db/passages.data.js) doit respecter avant le seed.
// Fonction pure : on lui donne des versets en mémoire, sans base de données.

import { describe, test, expect } from 'vitest';
import { validatePassages } from '../../scripts/passageRules.js';

// Une mini-Bible : Gn 1,1 à 1,3 puis Ex 1,1, dans l'ordre de lecture
const sourceVerses = [
  { code: 'Gn', chapter: '1', verse: '1' },
  { code: 'Gn', chapter: '1', verse: '2' },
  { code: 'Gn', chapter: '1', verse: '3' },
  { code: 'Ex', chapter: '1', verse: '1' },
];

const validPassage = { slug: 'creation', title: 'La Création', book: 'Gn', start: ['1', '1'], end: ['1', '3'], icon: 'sun' };

const validateOne = (changes) => () => validatePassages([{ ...validPassage, ...changes }], sourceVerses);

describe('validatePassages', () => {
  test('une liste correcte est acceptée', () => {
    expect(validateOne({})).not.toThrow();
  });

  test('un passage d\'un seul verset est accepté (début = fin)', () => {
    expect(validateOne({ end: ['1', '1'] })).not.toThrow();
  });

  test('un slug mal formé est refusé', () => {
    expect(validateOne({ slug: 'La Création' })).toThrow('Slug "La Création" mal formé');
  });

  test('un passage sans pictogramme (ou mal écrit) est refusé', () => {
    expect(validateOne({ icon: undefined })).toThrow('Passage "La Création" : pictogramme "undefined" mal formé');
    expect(validateOne({ icon: 'Soleil' })).toThrow('Passage "La Création" : pictogramme "Soleil" mal formé');
  });

  test('un livre inconnu est refusé', () => {
    expect(validateOne({ book: 'Xx' })).toThrow('Passage "La Création" : livre Xx introuvable.');
  });

  test('un verset de début inexistant est refusé', () => {
    expect(validateOne({ start: ['1', '99'] })).toThrow('Passage "La Création" : Gn 1,99 introuvable.');
  });

  test('un verset de fin inexistant est refusé', () => {
    expect(validateOne({ end: ['2', '1'] })).toThrow('Passage "La Création" : Gn 2,1 introuvable.');
  });

  test('un verset d\'un AUTRE livre ne compte pas (Ex 1,1 n\'est pas dans la Genèse)', () => {
    expect(validateOne({ book: 'Gn', start: ['1', '1'], end: ['1', '1'], title: 'T' })).not.toThrow();
    expect(validateOne({ book: 'Ex', start: ['1', '1'], end: ['1', '3'] })).toThrow('Ex 1,3 introuvable.');
  });

  test('un début situé après la fin est refusé', () => {
    expect(validateOne({ start: ['1', '3'], end: ['1', '1'] })).toThrow(
      'Passage "La Création" : le début est après la fin.',
    );
  });

  test('l\'erreur désigne le passage fautif, même au milieu de la liste', () => {
    const passages = [validPassage, { ...validPassage, slug: 'autre', title: 'Fautif', start: ['1', '9'] }];

    expect(() => validatePassages(passages, sourceVerses)).toThrow('Passage "Fautif" : Gn 1,9 introuvable.');
  });
});
