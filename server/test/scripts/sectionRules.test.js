// Tests des règles des sous-chapitres (db/sections.data.js), vérifiées avant le seed : fonction pure.

import { describe, test, expect } from 'vitest';
import { validateSections } from '../../scripts/sectionRules.js';

const sourceVerses = [
  { code: 'Gn', chapter: '1', verse: '1' },
  { code: 'Gn', chapter: '1', verse: '2' },
  { code: 'Gn', chapter: '2', verse: '4a' },
];

const section = (changes) => ({ book: 'Gn', start: ['1', '1'], title: 'Au commencement', status: 'proposé', ...changes });
const validate = (...sections) => () => validateSections(sections, sourceVerses);

describe('validateSections', () => {
  test('des sous-chapitres corrects sont acceptés', () => {
    expect(validate(section({}), section({ start: ['2', '4a'], title: 'Le jardin' }))).not.toThrow();
  });

  test('un verset de début inexistant est refusé', () => {
    expect(validate(section({ start: ['2', '4'] }))).toThrow('Sous-chapitre "Au commencement" : Gn 2,4 introuvable.');
  });

  test('un titre vide est refusé', () => {
    expect(validate(section({ title: ' ' }))).toThrow('Sous-chapitre " " : titre vide.');
  });

  test('deux sous-chapitres ne commencent pas au même verset', () => {
    expect(validate(section({}), section({ title: 'Autre' }))).toThrow(
      'Sous-chapitre "Autre" : un autre sous-chapitre commence déjà en Gn 1,1.',
    );
  });

  test('le statut doit être « proposé » ou « validé »', () => {
    expect(validate(section({ status: 'brouillon' }))).toThrow('statut "brouillon" inconnu');
  });
});
