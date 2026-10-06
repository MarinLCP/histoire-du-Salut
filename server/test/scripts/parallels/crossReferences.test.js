// Tests de la lecture du fichier des parallèles (OpenBible.info) : fonction pure, sur un petit texte.

import { describe, test, expect } from 'vitest';
import { parseCrossReferences } from '../../../scripts/parallels/crossReferences.js';

const text = [
  'From Verse\tTo Verse\tVotes\t#www.openbible.info CC-BY 2026-10-05',
  'Gen.1.1\tIsa.40.28\t67',
  'Gen.1.1\tJohn.1.1-John.1.3\t379',
  'Gen.1.2\tJer.4.23\t0',
  'Gen.1.3\t2Cor.4.6\t-3',
  '',
].join('\n');

describe('parseCrossReferences', () => {
  test('lit chaque lien : verset de départ, verset (ou plage) d\'arrivée, votes', () => {
    const [first, second] = parseCrossReferences(text);

    expect(first).toEqual({
      from: { book: 'Gen', chapter: 1, verse: 1 },
      to: { start: { book: 'Isa', chapter: 40, verse: 28 }, end: { book: 'Isa', chapter: 40, verse: 28 } },
      votes: 67,
    });
    expect(second.to).toEqual({ start: { book: 'John', chapter: 1, verse: 1 }, end: { book: 'John', chapter: 1, verse: 3 } });
  });

  test('ne garde que les liens aux votes positifs (les autres ont été jugés faux par les lecteurs)', () => {
    expect(parseCrossReferences(text)).toHaveLength(2);
  });

  test('une référence mal écrite arrête la lecture avec un message clair (numéro de ligne)', () => {
    expect(() => parseCrossReferences(`${text}Gen.1\tIsa.40.28\t5\n`)).toThrow('Ligne 6 : référence « Gen.1 » illisible.');
  });
});
