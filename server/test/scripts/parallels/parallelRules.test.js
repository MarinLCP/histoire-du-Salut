// Tests de la mise en correspondance des parallèles avec les versets de la Bible AELF (fonction pure).

import { describe, test, expect } from 'vitest';
import { matchParallels, requireFullMatch } from '../../../scripts/parallels/parallelRules.js';

// Une petite Bible AELF : Gn 32,1-3, Ml 3,23-24 et Mt 11,14
const SOURCE = [
  ['Gn', '32', '1'], ['Gn', '32', '2'], ['Gn', '32', '3'],
  ['Ml', '3', '23'], ['Ml', '3', '24'],
  ['Mt', '11', '14'],
].map(([code, chapter, verse]) => ({ code, chapter, verse }));

const ref = (book, chapter, verse) => ({ book, chapter, verse });
const link = (from, start, end = start, votes = 5) => ({ from, to: { start, end }, votes });

describe('matchParallels', () => {
  test('convertit les deux côtés du lien en références AELF', () => {
    const { parallels, unmatched } = matchParallels([link(ref('Matt', 11, 14), ref('Mal', 4, 5), ref('Mal', 4, 6), 42)], SOURCE);

    expect(unmatched).toEqual([]);
    expect(parallels).toEqual([{
      from: { book: 'Mt', chapter: '11', verse: 14 },
      toStart: { book: 'Ml', chapter: '3', verse: 23 },
      toEnd: { book: 'Ml', chapter: '3', verse: 24 },
      votes: 42,
    }]);
  });

  test('un verset absent de l\'AELF : le lien est mis de côté avec la raison', () => {
    const missing = link(ref('Gen', 32, 3), ref('Mal', 4, 5));

    const { parallels, unmatched } = matchParallels([missing], SOURCE);

    expect(parallels).toEqual([]);
    expect(unmatched).toEqual([{ link: missing, reason: 'verset introuvable : Gn 32,4' }]);
  });

  test('une plage à l\'envers est mise de côté', () => {
    const backwards = link(ref('Matt', 11, 14), ref('Gen', 32, 2), ref('Gen', 32, 1));

    const { unmatched } = matchParallels([backwards], SOURCE);

    expect(unmatched.map((entry) => entry.reason)).toEqual(['plage à l\'envers : Gn 32,3 – Gn 32,2']);
  });

  test('une plage peut passer d\'un livre au suivant, dans l\'ordre de la Bible', () => {
    const { parallels, unmatched } = matchParallels([link(ref('Matt', 11, 14), ref('Gen', 32, 2), ref('Mal', 4, 5))], SOURCE);

    expect(unmatched).toEqual([]);
    expect(parallels[0].toEnd).toEqual({ book: 'Ml', chapter: '3', verse: 23 });
  });

  test('deux liens rendus identiques par la conversion n\'en font qu\'un, le plus voté', () => {
    // 2 Co 13,13 et 13,14 (protestants) sont fusionnés en 2 Co 13,12-13 : ici, deux liens vers le même verset
    const source = [...SOURCE, { code: '2Co', chapter: '13', verse: '12' }, { code: '2Co', chapter: '13', verse: '13' }];
    const links = [link(ref('2Cor', 13, 12), ref('Mal', 4, 5), ref('Mal', 4, 5), 7), link(ref('2Cor', 13, 13), ref('Mal', 4, 5), ref('Mal', 4, 5), 9)];

    const { parallels } = matchParallels(links, source);

    expect(parallels.map((parallel) => parallel.votes)).toEqual([9]);
  });
});

describe('requireFullMatch', () => {
  test('ne dit rien quand tout correspond, s\'arrête sinon', () => {
    expect(() => requireFullMatch([])).not.toThrow();
    expect(() => requireFullMatch([{ reason: 'verset introuvable : Gn 32,4' }]))
      .toThrow('1 parallèle(s) sans verset AELF (ex. verset introuvable : Gn 32,4)');
  });
});
