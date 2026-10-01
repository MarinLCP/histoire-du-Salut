// Tests unitaires du use case "lire un passage", avec un FAUX repository en mémoire :
// aucune base de données, le test ne vérifie que l'orchestration.

import { describe, test, expect } from 'vitest';
import { makeGetPassage } from '../../src/application/getPassage.js';
import { NotFoundError } from '../../src/domain/errors.js';

const creation = { slug: 'creation', title: 'La Création', verses: [] };

const fakeRepository = {
  findBySlug: async (slug) => (slug.value === 'creation' ? creation : null),
};

describe('getPassage', () => {
  const getPassage = makeGetPassage(fakeRepository);

  test('renvoie le passage demandé', async () => {
    expect(await getPassage('creation')).toBe(creation);
  });

  test('un passage qui n\'existe pas : NotFoundError', async () => {
    await expect(getPassage('passage-inconnu')).rejects.toThrow(NotFoundError);
  });

  test('un slug mal formé : NotFoundError, sans même interroger le repository', async () => {
    const repositoryNeverCalled = { findBySlug: () => { throw new Error('ne doit pas être appelé'); } };

    await expect(makeGetPassage(repositoryNeverCalled)('CREATION')).rejects.toThrow(NotFoundError);
  });
});
