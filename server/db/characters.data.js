// Les personnages des épisodes. PROPOSÉS PAR CLAUDE (2026-10-03) ; Marin les relit sur la page de relecture.
// Leurs apparitions ne sont pas écrites à la main : le seed les calcule en cherchant leurs noms dans le texte
// AELF de chaque épisode (scripts/characterRules.js).
// - name : le nom affiché ;
// - searchNames : les noms cherchés dans le texte, écrits comme dans la Bible AELF (ex. Abram, Acab) ;
// - books : les livres où chercher (le même nom peut désigner deux personnes : Joseph fils de Jacob, dans la
//   Genèse, et Joseph de Nazareth, dans Luc) ;
// - notIn : les épisodes où ce nom désigne quelqu'un d'autre (slugs de passages.data.js) ;
// - status : 'proposé' (jamais mis en ligne) ou 'validé' (mis en ligne au prochain npm run seed:prod).
// L'ordre de la liste est l'ordre d'affichage. Après une modification : npm run seed

const proposed = (slug, name, books, { searchNames = [name], notIn = [] } = {}) =>
  ({ slug, name, searchNames, books, notIn, status: 'proposé' });

export const characters = [
  proposed('eve', 'Ève', ['Gn']),
  proposed('noe', 'Noé', ['Gn']),
  proposed('abraham', 'Abraham', ['Gn'], { searchNames: ['Abraham', 'Abram'] }),
  proposed('sara', 'Sara', ['Gn'], { searchNames: ['Saraï', 'Sara'] }),
  proposed('loth', 'Loth', ['Gn']),
  proposed('isaac', 'Isaac', ['Gn']),
  proposed('jacob', 'Jacob', ['Gn']),
  proposed('joseph', 'Joseph', ['Gn']),
  proposed('benjamin', 'Benjamin', ['Gn']),
  proposed('pharaon', 'Pharaon', ['Gn', 'Ex']),
  proposed('moise', 'Moïse', ['Ex', 'Jos']),
  proposed('aaron', 'Aaron', ['Ex']),
  proposed('jethro', 'Jéthro', ['Ex']),
  proposed('josue', 'Josué', ['Jos']),
  proposed('rahab', 'Rahab', ['Jos']),
  proposed('samuel', 'Samuel', ['1S']),
  proposed('saul', 'Saül', ['1S']),
  proposed('jesse', 'Jessé', ['1S']),
  proposed('david', 'David', ['1S', '2S', '1R']),
  proposed('goliath', 'Goliath', ['1S']),
  proposed('nathan', 'Nathan', ['2S']),
  proposed('salomon', 'Salomon', ['1R']),
  proposed('elie', 'Élie', ['1R']),
  proposed('acab', 'Acab', ['1R']),
  proposed('jezabel', 'Jézabel', ['1R']),
  proposed('abdias', 'Abdias', ['1R']),
  proposed('elisee', 'Élisée', ['1R']),
  proposed('nabucodonosor', 'Nabucodonosor', ['2R', 'Jr', 'Esd']),
  // Le Sédécias de Jr 29 est un faux prophète, pas le roi : on ne cherche que dans 2 R
  proposed('sedecias', 'Sédécias', ['2R']),
  proposed('godolias', 'Godolias', ['2R']),
  proposed('jeremie', 'Jérémie', ['Jr']),
  proposed('cyrus', 'Cyrus', ['Esd']),
  proposed('zacharie', 'Zacharie', ['Lc']),
  proposed('elisabeth', 'Élisabeth', ['Lc']),
  proposed('gabriel', 'Gabriel', ['Lc']),
  // En Lc 24, les Marie sont Marie Madeleine et Marie, mère de Jacques
  proposed('marie', 'Marie', ['Lc'], { notIn: ['resurrection-luc'] }),
  // En Lc 23, le Joseph est Joseph d'Arimathie
  proposed('joseph-de-nazareth', 'Joseph de Nazareth', ['Lc'], { searchNames: ['Joseph'], notIn: ['passion'] }),
  // En Lc 22, le Jean est l'apôtre
  proposed('jean-baptiste', 'Jean le Baptiste', ['Lc'], { searchNames: ['Jean'], notIn: ['passion'] }),
  proposed('symeon', 'Syméon', ['Lc']),
  proposed('anne', 'Anne', ['Lc']),
  proposed('jesus', 'Jésus', ['Mt', 'Lc', 'Jn', 'Ac']),
  proposed('pierre', 'Pierre', ['Lc', 'Jn', 'Ac']),
  proposed('judas', 'Judas', ['Lc']),
  proposed('pilate', 'Pilate', ['Lc']),
  // En Lc 1, l'Hérode est Hérode le Grand ; dans la Passion, Hérode Antipas
  proposed('herode', 'Hérode Antipas', ['Lc'], { searchNames: ['Hérode'], notIn: ['annonciation-nativite'] }),
  proposed('simon-de-cyrene', 'Simon de Cyrène', ['Lc'], { searchNames: ['Simon de Cyrène'] }),
  proposed('joseph-d-arimathie', 'Joseph d\'Arimathie', ['Lc'], { searchNames: ['Arimathie'] }),
  proposed('marie-madeleine', 'Marie Madeleine', ['Lc', 'Jn'], { searchNames: ['Madeleine'] }),
  proposed('cleophas', 'Cléophas', ['Lc']),
  proposed('thomas', 'Thomas', ['Jn']),
];
