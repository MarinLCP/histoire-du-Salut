// Tests de la conversion des références (numérotation des Bibles protestantes, codes anglais) vers l'AELF.
// Chaque règle est vérifiée à son premier et à son dernier verset. Format : [« référence du fichier », « AELF »].

import { describe, test, expect } from 'vitest';
import { toAelf } from '../../../scripts/parallels/versification.js';

// "Gen.31.55" -> { book: 'Gen', chapter: 31, verse: 55 }
const reference = (text) => {
  const [book, chapter, verse] = text.split('.');
  return { book, chapter: Number(chapter), verse: Number(verse) };
};
// { book: 'Gn', chapter: '32', verse: '1' } -> "Gn 32,1"
const written = ({ book, chapter, verse }) => `${book} ${chapter},${verse}`;
const check = (pairs) => pairs.forEach(([from, expected]) => expect(written(toAelf(reference(from))), from).toBe(expected));

describe('toAelf', () => {
  test('les codes des livres, sans changement de numéro', () => {
    check([['Gen.1.1', 'Gn 1,1'], ['John.3.16', 'Jn 3,16'], ['Rev.22.21', 'Ap 22,21'], ['1Kgs.1.1', '1R 1,1'],
      ['Song.1.1', 'Ct 1,1'], ['Eccl.1.1', 'Qo 1,1'], ['Jas.1.1', 'Jc 1,1'], ['Gen.31.54', 'Gn 31,54']]);
  });

  test('Abdias : un seul chapitre, numéroté 0 dans l\'AELF', () => {
    check([['Obad.1.1', 'Ab 0,1'], ['Obad.1.21', 'Ab 0,21']]);
  });

  test('Pentateuque : Gn 31-32, Ex 7-8 et 21-22, Lv 5-6, Nb 16-17 et 29-30, Dt 12-13, 22-23 et 28-29', () => {
    check([
      ['Gen.31.55', 'Gn 32,1'], ['Gen.32.1', 'Gn 32,2'], ['Gen.32.32', 'Gn 32,33'],
      ['Exod.8.1', 'Ex 7,26'], ['Exod.8.4', 'Ex 7,29'], ['Exod.8.5', 'Ex 8,1'], ['Exod.8.32', 'Ex 8,28'],
      ['Exod.22.1', 'Ex 21,37'], ['Exod.22.2', 'Ex 22,1'], ['Exod.22.31', 'Ex 22,30'],
      ['Lev.6.1', 'Lv 5,20'], ['Lev.6.7', 'Lv 5,26'], ['Lev.6.8', 'Lv 6,1'], ['Lev.6.30', 'Lv 6,23'],
      ['Num.16.36', 'Nb 17,1'], ['Num.16.50', 'Nb 17,15'], ['Num.17.1', 'Nb 17,16'], ['Num.17.13', 'Nb 17,28'],
      ['Num.29.40', 'Nb 30,1'], ['Num.30.1', 'Nb 30,2'], ['Num.30.16', 'Nb 30,17'],
      ['Deut.12.32', 'Dt 13,1'], ['Deut.13.1', 'Dt 13,2'], ['Deut.13.18', 'Dt 13,19'],
      ['Deut.22.30', 'Dt 23,1'], ['Deut.23.1', 'Dt 23,2'], ['Deut.23.25', 'Dt 23,26'],
      ['Deut.29.1', 'Dt 28,69'], ['Deut.29.2', 'Dt 29,1'], ['Deut.29.29', 'Dt 29,28'],
    ]);
  });

  test('livres historiques : 1-2 S, 1-2 R, 1-2 Ch, Ne', () => {
    check([
      ['1Sam.20.42', '1S 20,42'], ['1Sam.21.1', '1S 21,2'], ['1Sam.21.15', '1S 21,16'],
      ['1Sam.23.29', '1S 24,1'], ['1Sam.24.1', '1S 24,2'], ['1Sam.24.22', '1S 24,23'],
      ['2Sam.18.33', '2S 19,1'], ['2Sam.19.1', '2S 19,2'], ['2Sam.19.43', '2S 19,44'],
      ['1Kgs.4.21', '1R 5,1'], ['1Kgs.4.34', '1R 5,14'], ['1Kgs.5.1', '1R 5,15'], ['1Kgs.5.18', '1R 5,32'],
      ['1Kgs.22.43', '1R 22,43'], ['1Kgs.22.44', '1R 22,45'], ['1Kgs.22.53', '1R 22,54'],
      ['2Kgs.11.21', '2R 12,1'], ['2Kgs.12.1', '2R 12,2'], ['2Kgs.12.21', '2R 12,22'],
      ['1Chr.6.1', '1Ch 5,27'], ['1Chr.6.15', '1Ch 5,41'], ['1Chr.6.16', '1Ch 6,1'], ['1Chr.6.81', '1Ch 6,66'],
      ['1Chr.12.4', '1Ch 12,4'], ['1Chr.12.5', '1Ch 12,6'], ['1Chr.12.40', '1Ch 12,41'],
      ['2Chr.2.1', '2Ch 1,18'], ['2Chr.2.2', '2Ch 2,1'], ['2Chr.2.18', '2Ch 2,17'],
      ['2Chr.14.1', '2Ch 13,23'], ['2Chr.14.2', '2Ch 14,1'], ['2Chr.14.15', '2Ch 14,14'],
      ['Neh.4.1', 'Ne 3,33'], ['Neh.4.6', 'Ne 3,38'], ['Neh.4.7', 'Ne 4,1'], ['Neh.4.23', 'Ne 4,17'],
      ['Neh.7.67', 'Ne 7,67'], ['Neh.7.68', 'Ne 7,67'], ['Neh.7.69', 'Ne 7,68'], ['Neh.7.73', 'Ne 7,72'],
      ['Neh.9.38', 'Ne 10,1'], ['Neh.10.1', 'Ne 10,2'], ['Neh.10.39', 'Ne 10,40'],
    ]);
  });

  test('livres poétiques et prophètes : Jb, Qo, Ct, Is, Jr, Ez, Dn, Os, Jl, Jon, Mi, Na, Za, Ml', () => {
    check([
      ['Job.41.1', 'Jb 40,25'], ['Job.41.8', 'Jb 40,32'], ['Job.41.9', 'Jb 41,1'], ['Job.41.34', 'Jb 41,26'],
      ['Eccl.5.1', 'Qo 4,17'], ['Eccl.5.2', 'Qo 5,1'], ['Eccl.5.20', 'Qo 5,19'],
      ['Song.6.13', 'Ct 7,1'], ['Song.7.1', 'Ct 7,2'], ['Song.7.13', 'Ct 7,14'],
      ['Isa.9.1', 'Is 8,23'], ['Isa.9.2', 'Is 9,1'], ['Isa.9.21', 'Is 9,20'],
      ['Isa.64.1', 'Is 63,19'], ['Isa.64.2', 'Is 64,1'], ['Isa.64.12', 'Is 64,11'],
      ['Jer.9.1', 'Jr 8,23'], ['Jer.9.2', 'Jr 9,1'], ['Jer.9.26', 'Jr 9,25'],
      ['Ezek.20.45', 'Ez 21,1'], ['Ezek.20.49', 'Ez 21,5'], ['Ezek.21.1', 'Ez 21,6'], ['Ezek.21.32', 'Ez 21,37'],
      // Dn 3 : l'AELF garde les ajouts grecs (3,24-90) ; la suite hébraïque est en 3,91-100
      ['Dan.3.23', 'Dn 3,23'], ['Dan.3.24', 'Dn 3,91'], ['Dan.3.30', 'Dn 3,97'],
      ['Dan.4.1', 'Dn 3,98'], ['Dan.4.3', 'Dn 3,100'], ['Dan.4.4', 'Dn 4,1'], ['Dan.4.37', 'Dn 4,34'],
      ['Dan.5.31', 'Dn 6,1'], ['Dan.6.1', 'Dn 6,2'], ['Dan.6.28', 'Dn 6,29'],
      ['Hos.1.10', 'Os 2,1'], ['Hos.1.11', 'Os 2,2'], ['Hos.2.1', 'Os 2,3'], ['Hos.2.23', 'Os 2,25'],
      ['Hos.11.12', 'Os 12,1'], ['Hos.12.1', 'Os 12,2'], ['Hos.12.14', 'Os 12,15'],
      ['Hos.13.16', 'Os 14,1'], ['Hos.14.1', 'Os 14,2'], ['Hos.14.9', 'Os 14,10'],
      ['Joel.2.27', 'Jl 2,27'], ['Joel.2.28', 'Jl 3,1'], ['Joel.2.32', 'Jl 3,5'], ['Joel.3.1', 'Jl 4,1'], ['Joel.3.21', 'Jl 4,21'],
      ['Jonah.1.17', 'Jon 2,1'], ['Jonah.2.1', 'Jon 2,2'], ['Jonah.2.10', 'Jon 2,11'],
      ['Mic.5.1', 'Mi 4,14'], ['Mic.5.2', 'Mi 5,1'], ['Mic.5.15', 'Mi 5,14'],
      ['Nah.1.15', 'Na 2,1'], ['Nah.2.1', 'Na 2,2'], ['Nah.2.13', 'Na 2,14'],
      ['Zech.1.18', 'Za 2,1'], ['Zech.1.21', 'Za 2,4'], ['Zech.2.1', 'Za 2,5'], ['Zech.2.13', 'Za 2,17'],
      ['Mal.3.18', 'Ml 3,18'], ['Mal.4.1', 'Ml 3,19'], ['Mal.4.5', 'Ml 3,23'], ['Mal.4.6', 'Ml 3,24'],
    ]);
  });

  test('Nouveau Testament : deux versets fusionnés en Ac 19 et 2 Co 13', () => {
    check([['Acts.19.40', 'Ac 19,40'], ['Acts.19.41', 'Ac 19,40'],
      ['2Cor.13.12', '2Co 13,12'], ['2Cor.13.13', '2Co 13,12'], ['2Cor.13.14', '2Co 13,13']]);
  });

  test('Psaumes : numérotation grecque de l\'AELF (9A, 9B, 113A...) et titres comptés comme versets', () => {
    check([
      ['Ps.1.1', 'Ps 1,1'], ['Ps.3.1', 'Ps 3,2'], ['Ps.8.9', 'Ps 8,10'],
      ['Ps.9.1', 'Ps 9A,2'], ['Ps.9.20', 'Ps 9A,21'], ['Ps.10.1', 'Ps 9B,1'], ['Ps.10.18', 'Ps 9B,18'],
      ['Ps.23.1', 'Ps 22,1'], ['Ps.24.1', 'Ps 23,1'], ['Ps.51.1', 'Ps 50,3'], ['Ps.51.19', 'Ps 50,21'],
      ['Ps.60.1', 'Ps 59,3'], ['Ps.72.19', 'Ps 71,19'], ['Ps.113.1', 'Ps 112,1'],
      ['Ps.114.1', 'Ps 113A,1'], ['Ps.115.1', 'Ps 113B,1'],
      ['Ps.116.1', 'Ps 114,1'], ['Ps.116.9', 'Ps 114,9'], ['Ps.116.10', 'Ps 115,10'], ['Ps.116.19', 'Ps 115,19'],
      ['Ps.119.176', 'Ps 118,176'], ['Ps.146.1', 'Ps 145,1'],
      ['Ps.147.1', 'Ps 146,1'], ['Ps.147.11', 'Ps 146,11'], ['Ps.147.12', 'Ps 147,12'], ['Ps.147.20', 'Ps 147,20'],
      ['Ps.148.1', 'Ps 148,1'], ['Ps.150.6', 'Ps 150,6'],
    ]);
  });

  test('Psaumes : cas particuliers (Ps 13 : versets 5 et 6 fusionnés ; Ps 72,20 absent de l\'AELF)', () => {
    check([['Ps.13.1', 'Ps 12,2'], ['Ps.13.4', 'Ps 12,5'], ['Ps.13.5', 'Ps 12,6'], ['Ps.13.6', 'Ps 12,6'],
      ['Ps.72.20', 'Ps 71,19']]);
  });

  test('un livre inconnu est refusé', () => {
    expect(() => toAelf({ book: 'Tob', chapter: 1, verse: 1 })).toThrow('Livre « Tob » inconnu.');
  });
});
