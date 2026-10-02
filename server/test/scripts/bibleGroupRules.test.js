// Tests du découpage de la Bible en grands ensembles (db/bible-groups.data.js), vérifié avant le seed.
// Fonction pure : listes en mémoire, sans base de données.

import { describe, test, expect } from 'vitest';
import { assignBookGroups } from '../../scripts/bibleGroupRules.js';

// Une mini-Bible de 5 livres, dans l'ordre de lecture
const bookCodes = ['Gn', 'Ex', 'Jos', 'Mt', 'Mc'];

const group = (slug, firstBook, lastBook) => ({ slug, title: `Titre ${slug}`, icon: 'book', firstBook, lastBook });
const pentateuch = group('pentateuque', 'Gn', 'Ex');
const historical = group('historiques', 'Jos', 'Jos');
const gospels = group('evangiles', 'Mt', 'Mc');

describe('assignBookGroups', () => {
  test('renvoie le grand ensemble de chaque livre', () => {
    const groups = assignBookGroups([pentateuch, historical, gospels], bookCodes);

    expect([...groups]).toEqual([
      ['Gn', 'pentateuque'], ['Ex', 'pentateuque'], ['Jos', 'historiques'], ['Mt', 'evangiles'], ['Mc', 'evangiles'],
    ]);
  });

  // Le détail (format, doublons) est testé une fois, dans dataIdentifier.test.js
  test('les slugs et pictogrammes des ensembles sont vérifiés', () => {
    const wrong = [{ ...pentateuch, icon: '' }, historical, gospels];

    expect(() => assignBookGroups(wrong, bookCodes)).toThrow('Ensemble "Titre pentateuque" : pictogramme "" mal formé.');
  });

  test('un livre inconnu est refusé', () => {
    const wrong = [group('pentateuque', 'Gn', 'Xx'), historical, gospels];

    expect(() => assignBookGroups(wrong, bookCodes)).toThrow('Ensemble "Titre pentateuque" : livre Xx introuvable.');
  });

  test('un trou entre deux ensembles est refusé (un livre n\'aurait pas d\'ensemble)', () => {
    const gap = [group('pentateuque', 'Gn', 'Gn'), historical, gospels];

    expect(() => assignBookGroups(gap, bookCodes)).toThrow(
      'Ensemble "Titre historiques" : commence à Jos, mais le livre suivant est Ex.',
    );
  });

  test('deux ensembles qui se chevauchent sont refusés', () => {
    const overlap = [pentateuch, group('historiques', 'Ex', 'Jos'), gospels];

    expect(() => assignBookGroups(overlap, bookCodes)).toThrow(
      'Ensemble "Titre historiques" : commence à Ex, mais le livre suivant est Jos.',
    );
  });

  test('un ensemble qui finit avant de commencer est refusé', () => {
    const reversed = [pentateuch, historical, group('evangiles', 'Mt', 'Jos')];

    expect(() => assignBookGroups(reversed, bookCodes)).toThrow('Ensemble "Titre evangiles" : Jos est avant Mt.');
  });

  test('les derniers livres sans ensemble sont refusés', () => {
    const missingEnd = [pentateuch, historical, group('evangiles', 'Mt', 'Mt')];

    expect(() => assignBookGroups(missingEnd, bookCodes)).toThrow('Livre Mc : dans aucun ensemble.');
  });
});
