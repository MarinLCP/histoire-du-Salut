// Tests des règles des époques (db/epochs.data.js) et de leur lien avec les passages, avant le seed.
// Fonction pure : listes en mémoire, sans base de données.

import { describe, test, expect } from 'vitest';
import { validateEpochs } from '../../scripts/epochRules.js';

const epochs = [
  { slug: 'origines', title: 'Les origines', icon: 'sun' },
  { slug: 'patriarches', title: 'Les patriarches', icon: 'tent' },
];

// Seuls slug, title et epoch comptent ici
const passage = (slug, epoch) => ({ slug, title: `Titre ${slug}`, epoch });
const validPassages = [passage('creation', 'origines'), passage('chute', 'origines'), passage('abraham', 'patriarches')];

describe('validateEpochs', () => {
  test('des époques correctes, chacune avec ses épisodes à la suite, sont acceptées', () => {
    expect(() => validateEpochs(epochs, validPassages)).not.toThrow();
  });

  test('un slug d\'époque mal formé est refusé', () => {
    const wrong = [{ ...epochs[0], slug: 'Les Origines' }, epochs[1]];

    expect(() => validateEpochs(wrong, validPassages)).toThrow('Époque "Les origines" : slug "Les Origines" mal formé');
  });

  test('deux époques avec le même slug sont refusées', () => {
    const twice = [epochs[0], { ...epochs[1], slug: 'origines' }];

    expect(() => validateEpochs(twice, validPassages)).toThrow('Époque "Les patriarches" : slug "origines" déjà utilisé');
  });

  test('une époque sans pictogramme est refusée', () => {
    const noIcon = [{ ...epochs[0], icon: '' }, epochs[1]];

    expect(() => validateEpochs(noIcon, validPassages)).toThrow('Époque "Les origines" : pictogramme "" mal formé');
  });

  test('un passage rattaché à une époque inconnue est refusé', () => {
    const passages = [...validPassages, passage('exode', 'exode')];

    expect(() => validateEpochs(epochs, passages)).toThrow('Passage "Titre exode" : époque "exode" introuvable.');
  });

  // Ces deux fautes sont la même règle : l'époque d'un passage ne revient jamais en arrière
  test('les épisodes d\'une époque doivent se suivre (pas d\'aller-retour entre époques)', () => {
    const passages = [passage('creation', 'origines'), passage('abraham', 'patriarches'), passage('chute', 'origines')];

    expect(() => validateEpochs(epochs, passages)).toThrow(
      'Passage "Titre chute" : époque "origines" après "patriarches" (les épisodes suivent l\'ordre des époques).',
    );
  });

  test('les époques doivent apparaître dans l\'ordre du fichier des époques', () => {
    const passages = [passage('abraham', 'patriarches'), passage('creation', 'origines')];

    expect(() => validateEpochs(epochs, passages)).toThrow(
      'Passage "Titre creation" : époque "origines" après "patriarches" (les épisodes suivent l\'ordre des époques).',
    );
  });

  test('une époque sans aucun épisode est refusée (elle ferait un bloc vide dans la frise)', () => {
    const passages = [passage('creation', 'origines')];

    expect(() => validateEpochs(epochs, passages)).toThrow('Époque "Les patriarches" : aucun épisode.');
  });
});
