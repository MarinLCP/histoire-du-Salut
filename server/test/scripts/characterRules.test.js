// Tests des personnages (db/characters.data.js) : leurs règles, et le calcul de leurs apparitions dans les épisodes.
// Fonctions pures : listes et textes en mémoire, sans base de données.

import { describe, test, expect } from 'vitest';
import { validateCharacters, characterAppearances } from '../../scripts/characterRules.js';

const character = (changes) => ({
  slug: 'abraham', name: 'Abraham', searchNames: ['Abraham', 'Abram'], books: ['Gn'], notIn: [], status: 'proposé', ...changes,
});
const passageSlugs = ['appel-abraham', 'buisson-ardent'];
const bookCodes = ['Gn', 'Ex', 'Lc'];
const validate = (...characters) => () => validateCharacters(characters, { passageSlugs, bookCodes });

describe('validateCharacters', () => {
  test('des personnages corrects sont acceptés', () => {
    expect(validate(character({}), character({ slug: 'moise', name: 'Moïse', searchNames: ['Moïse'], books: ['Ex'] }))).not.toThrow();
  });

  test('un slug mal formé ou déjà utilisé est refusé', () => {
    expect(validate(character({ slug: 'Abraham' }))).toThrow('Personnage "Abraham" : slug "Abraham" mal formé.');
    expect(validate(character({}), character({ name: 'Autre' }))).toThrow('Personnage "Autre" : slug "abraham" déjà utilisé.');
  });

  test('il faut au moins un nom à chercher, et des livres qui existent', () => {
    expect(validate(character({ searchNames: [] }))).toThrow('Personnage "Abraham" : aucun nom à chercher.');
    expect(validate(character({ books: ['Xx'] }))).toThrow('Personnage "Abraham" : livre Xx introuvable.');
  });

  test('un épisode exclu doit exister', () => {
    expect(validate(character({ notIn: ['inconnu'] }))).toThrow('Personnage "Abraham" : épisode "inconnu" introuvable.');
  });

  test('le statut doit être « proposé » ou « validé »', () => {
    expect(validate(character({ status: 'peut-être' }))).toThrow('statut "peut-être" inconnu');
  });
});

describe('characterAppearances', () => {
  const passages = [
    { slug: 'appel-abraham', book: 'Gn', text: 'Abram partit. Le Seigneur dit à Abram : « Va. »' },
    { slug: 'buisson-ardent', book: 'Ex', text: 'Je suis le Dieu d\'Abraham, le Dieu de Moïse.' },
    { slug: 'annonciation', book: 'Lc', text: 'Marie dit : « Voici la servante. » Joseph aussi.' },
    { slug: 'resurrection', book: 'Lc', text: 'Marie Madeleine et Marie, mère de Jacques.' },
  ];

  test('compte les mentions de chaque nom (et de ses autres noms), mot entier', () => {
    const appearances = characterAppearances([character({})], passages);

    expect(appearances).toEqual([{ character: 'abraham', passage: 'appel-abraham', mentions: 2 }]);
  });

  test('cherche seulement dans ses livres : le Dieu d\'Abraham, dans l\'Exode, n\'est pas une apparition', () => {
    const appearances = characterAppearances([character({ books: ['Gn', 'Ex'] })], passages);

    expect(appearances.map((appearance) => appearance.passage)).toEqual(['appel-abraham', 'buisson-ardent']);
  });

  test('un épisode exclu (le même nom y désigne quelqu\'un d\'autre) est sauté', () => {
    const mary = character({ slug: 'marie', name: 'Marie', searchNames: ['Marie'], books: ['Lc'], notIn: ['resurrection'] });

    expect(characterAppearances([mary], passages)).toEqual([{ character: 'marie', passage: 'annonciation', mentions: 1 }]);
  });

  test('un nom n\'est pas trouvé à l\'intérieur d\'un autre mot (« Marie » dans « Mariette »)', () => {
    const mary = character({ slug: 'marie', name: 'Marie', searchNames: ['Marie'], books: ['Lc'] });

    expect(characterAppearances([mary], [{ slug: 'x', book: 'Lc', text: 'Mariette et Mariella.' }])).toEqual([]);
  });
});
