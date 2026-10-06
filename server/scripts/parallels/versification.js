// Convertit une référence du fichier des parallèles (OpenBible.info) en référence AELF.
// Le fichier utilise des codes de livres anglais (« Gen », « 1Kgs ») et la numérotation des Bibles
// protestantes ; l'AELF suit la numérotation hébraïque pour l'Ancien Testament (et grecque pour les Psaumes).
// Les différences ont été relevées chapitre par chapitre en comparant le fichier à la base AELF (V9.0).

import { VerseReference } from '../../src/domain/VerseReference.js';
import { psalmToAelf } from './psalms.js';

// Code du fichier -> code AELF (les 66 livres ; le fichier n'a pas les livres deutérocanoniques)
const BOOKS = {
  Gen: 'Gn', Exod: 'Ex', Lev: 'Lv', Num: 'Nb', Deut: 'Dt', Josh: 'Jos', Judg: 'Jg', Ruth: 'Rt',
  '1Sam': '1S', '2Sam': '2S', '1Kgs': '1R', '2Kgs': '2R', '1Chr': '1Ch', '2Chr': '2Ch', Ezra: 'Esd', Neh: 'Ne',
  Esth: 'Est', Job: 'Jb', Ps: 'Ps', Prov: 'Pr', Eccl: 'Qo', Song: 'Ct', Isa: 'Is', Jer: 'Jr', Lam: 'Lm',
  Ezek: 'Ez', Dan: 'Dn', Hos: 'Os', Joel: 'Jl', Amos: 'Am', Obad: 'Ab', Jonah: 'Jon', Mic: 'Mi', Nah: 'Na',
  Hab: 'Ha', Zeph: 'So', Hag: 'Ag', Zech: 'Za', Mal: 'Ml',
  Matt: 'Mt', Mark: 'Mc', Luke: 'Lc', John: 'Jn', Acts: 'Ac', Rom: 'Rm', '1Cor': '1Co', '2Cor': '2Co',
  Gal: 'Ga', Eph: 'Ep', Phil: 'Ph', Col: 'Col', '1Thess': '1Th', '2Thess': '2Th', '1Tim': '1Tm', '2Tim': '2Tm',
  Titus: 'Tt', Phlm: 'Phm', Heb: 'He', Jas: 'Jc', '1Pet': '1P', '2Pet': '2P', '1John': '1Jn', '2John': '2Jn',
  '3John': '3Jn', Jude: 'Jude', Rev: 'Ap',
};

// Les passages numérotés autrement. Une ligne : [livre AELF, chapitre, premier verset, dernier verset]
// (numérotation protestante) -> [chapitre AELF, premier verset AELF] ; les versets suivants suivent dans l'ordre.
// Exemple : ['Ex', 8, 1, 4, '7', 26] se lit « Ex 8,1-4 devient Ex 7,26-29 ».
const SHIFTS = [
  ['Gn', 31, 55, 55, '32', 1], ['Gn', 32, 1, 32, '32', 2],
  ['Ex', 8, 1, 4, '7', 26], ['Ex', 8, 5, 32, '8', 1], ['Ex', 22, 1, 1, '21', 37], ['Ex', 22, 2, 31, '22', 1],
  ['Lv', 6, 1, 7, '5', 20], ['Lv', 6, 8, 30, '6', 1],
  ['Nb', 16, 36, 50, '17', 1], ['Nb', 17, 1, 13, '17', 16], ['Nb', 29, 40, 40, '30', 1], ['Nb', 30, 1, 16, '30', 2],
  ['Dt', 12, 32, 32, '13', 1], ['Dt', 13, 1, 18, '13', 2], ['Dt', 22, 30, 30, '23', 1], ['Dt', 23, 1, 25, '23', 2],
  ['Dt', 29, 1, 1, '28', 69], ['Dt', 29, 2, 29, '29', 1],
  ['1S', 21, 1, 15, '21', 2], ['1S', 23, 29, 29, '24', 1], ['1S', 24, 1, 22, '24', 2],
  ['2S', 18, 33, 33, '19', 1], ['2S', 19, 1, 43, '19', 2],
  ['1R', 4, 21, 34, '5', 1], ['1R', 5, 1, 18, '5', 15], ['1R', 22, 44, 53, '22', 45],
  ['2R', 11, 21, 21, '12', 1], ['2R', 12, 1, 21, '12', 2],
  ['1Ch', 6, 1, 15, '5', 27], ['1Ch', 6, 16, 81, '6', 1], ['1Ch', 12, 5, 40, '12', 6],
  ['2Ch', 2, 1, 1, '1', 18], ['2Ch', 2, 2, 18, '2', 1], ['2Ch', 14, 1, 1, '13', 23], ['2Ch', 14, 2, 15, '14', 1],
  // Ne 7,68 n'existe pas dans le texte hébreu : il rejoint Ne 7,67
  ['Ne', 4, 1, 6, '3', 33], ['Ne', 4, 7, 23, '4', 1], ['Ne', 7, 68, 68, '7', 67], ['Ne', 7, 69, 73, '7', 68],
  ['Ne', 9, 38, 38, '10', 1], ['Ne', 10, 1, 39, '10', 2],
  ['Jb', 41, 1, 8, '40', 25], ['Jb', 41, 9, 34, '41', 1],
  ['Qo', 5, 1, 1, '4', 17], ['Qo', 5, 2, 20, '5', 1],
  ['Ct', 6, 13, 13, '7', 1], ['Ct', 7, 1, 13, '7', 2],
  ['Is', 9, 1, 1, '8', 23], ['Is', 9, 2, 21, '9', 1], ['Is', 64, 1, 1, '63', 19], ['Is', 64, 2, 12, '64', 1],
  ['Jr', 9, 1, 1, '8', 23], ['Jr', 9, 2, 26, '9', 1],
  ['Ez', 20, 45, 49, '21', 1], ['Ez', 21, 1, 32, '21', 6],
  // Dn 3 : l'AELF garde les ajouts grecs en 3,24-90 ; la suite du texte hébreu devient 3,91-100
  ['Dn', 3, 24, 30, '3', 91], ['Dn', 4, 1, 3, '3', 98], ['Dn', 4, 4, 37, '4', 1],
  ['Dn', 5, 31, 31, '6', 1], ['Dn', 6, 1, 28, '6', 2],
  ['Os', 1, 10, 11, '2', 1], ['Os', 2, 1, 23, '2', 3], ['Os', 11, 12, 12, '12', 1], ['Os', 12, 1, 14, '12', 2],
  ['Os', 13, 16, 16, '14', 1], ['Os', 14, 1, 9, '14', 2],
  ['Jl', 2, 28, 32, '3', 1], ['Jl', 3, 1, 21, '4', 1],
  // Abdias n'a qu'un chapitre, numéroté 0 dans l'AELF
  ['Ab', 1, 1, 21, '0', 1],
  ['Jon', 1, 17, 17, '2', 1], ['Jon', 2, 1, 10, '2', 2],
  ['Mi', 5, 1, 1, '4', 14], ['Mi', 5, 2, 15, '5', 1],
  ['Na', 1, 15, 15, '2', 1], ['Na', 2, 1, 13, '2', 2],
  ['Za', 1, 18, 21, '2', 1], ['Za', 2, 1, 13, '2', 5],
  ['Ml', 4, 1, 6, '3', 19],
  // Deux versets fusionnés dans l'AELF
  ['Ac', 19, 41, 41, '19', 40], ['2Co', 13, 13, 14, '13', 12],
];

// Les décalages rangés par chapitre (« Gn|31 » -> ses lignes) : un million de références à convertir
const SHIFTS_BY_CHAPTER = Map.groupBy(SHIFTS, ([book, chapter]) => `${book}|${chapter}`);

/**
 * @param {{ book: string, chapter: number, verse: number }} reference code anglais, numérotation protestante
 * @returns {VerseReference} la même référence dans l'AELF
 */
export function toAelf({ book, chapter, verse }) {
  const aelfBook = BOOKS[book];
  if (!aelfBook) throw new Error(`Livre « ${book} » inconnu.`);
  const place = aelfBook === 'Ps' ? psalmToAelf(chapter, verse) : shifted(aelfBook, chapter, verse);
  return VerseReference.from({ book: aelfBook, ...place });
}

function shifted(book, chapter, verse) {
  const shifts = SHIFTS_BY_CHAPTER.get(`${book}|${chapter}`) ?? [];
  const shift = shifts.find(([, , first, last]) => verse >= first && verse <= last);
  if (!shift) return { chapter, verse };
  const [, , first, , aelfChapter, aelfFirst] = shift;
  return { chapter: aelfChapter, verse: aelfFirst + verse - first };
}
