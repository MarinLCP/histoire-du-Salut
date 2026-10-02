// Tests des identifiants des fichiers de données (époques, grands ensembles) : fonction pure.

import { describe, test, expect } from 'vitest';
import { validateSlugList } from '../../scripts/dataIdentifier.js';

const items = [
  { slug: 'origines', title: 'Les origines', icon: 'sun' },
  { slug: 'terre-promise', title: 'La Terre promise', icon: 'walls' },
];

const validateWith = (changes) => () => validateSlugList([{ ...items[0], ...changes }, items[1]], 'Époque');

describe('validateSlugList', () => {
  test('une liste correcte est acceptée', () => {
    expect(validateWith({})).not.toThrow();
  });

  test('un slug mal formé est refusé', () => {
    expect(validateWith({ slug: 'Les Origines' })).toThrow('Époque "Les origines" : slug "Les Origines" mal formé.');
  });

  test('un pictogramme absent ou mal formé est refusé', () => {
    expect(validateWith({ icon: '' })).toThrow('Époque "Les origines" : pictogramme "" mal formé.');
    expect(validateWith({ icon: undefined })).toThrow('Époque "Les origines" : pictogramme "undefined" mal formé.');
  });

  test('deux éléments avec le même slug : le second est refusé', () => {
    const twice = [items[0], { ...items[1], slug: 'origines' }];

    expect(() => validateSlugList(twice, 'Ensemble')).toThrow('Ensemble "La Terre promise" : slug "origines" déjà utilisé.');
  });
});
