// Les personnages des épisodes : proposés par Claude (2026-10-03), validés par Marin (2026-10-06).
// Leurs apparitions ne sont pas écrites à la main : le seed les calcule en cherchant leurs noms dans le texte
// AELF de chaque épisode (scripts/characterRules.js).
// - name : le nom affiché ;
// - searchNames : les noms cherchés dans le texte, écrits comme dans la Bible AELF (ex. Abram, Acab) ;
// - books : les livres où chercher (le même nom peut désigner deux personnes : Joseph fils de Jacob, dans la
//   Genèse, et Joseph de Nazareth, dans Luc) ;
// - notIn : les épisodes où ce nom désigne quelqu'un d'autre (slugs de passages.data.js) ;
// - status : 'proposé' (jamais mis en ligne) ou 'validé' (mis en ligne au prochain npm run seed:prod).
// L'ordre de la liste est l'ordre d'affichage. Après une modification : npm run seed

const validated = (slug, name, books, { searchNames = [name], notIn = [] } = {}) =>
  ({ slug, name, searchNames, books, notIn, status: 'validé' });

export const characters = [
  validated('eve', 'Ève', ['Gn']),
  validated('noe', 'Noé', ['Gn']),
  validated('abraham', 'Abraham', ['Gn'], { searchNames: ['Abraham', 'Abram'] }),
  validated('sara', 'Sara', ['Gn'], { searchNames: ['Saraï', 'Sara'] }),
  validated('loth', 'Loth', ['Gn']),
  validated('isaac', 'Isaac', ['Gn']),
  validated('jacob', 'Jacob', ['Gn']),
  validated('joseph', 'Joseph', ['Gn']),
  validated('benjamin', 'Benjamin', ['Gn']),
  validated('pharaon', 'Pharaon', ['Gn', 'Ex']),
  validated('moise', 'Moïse', ['Ex', 'Jos']),
  validated('aaron', 'Aaron', ['Ex']),
  validated('jethro', 'Jéthro', ['Ex']),
  validated('josue', 'Josué', ['Jos']),
  validated('rahab', 'Rahab', ['Jos']),
  validated('samuel', 'Samuel', ['1S']),
  validated('saul', 'Saül', ['1S']),
  validated('jesse', 'Jessé', ['1S']),
  validated('david', 'David', ['1S', '2S', '1R']),
  validated('goliath', 'Goliath', ['1S']),
  validated('nathan', 'Nathan', ['2S']),
  validated('salomon', 'Salomon', ['1R']),
  validated('elie', 'Élie', ['1R']),
  validated('acab', 'Acab', ['1R']),
  validated('jezabel', 'Jézabel', ['1R']),
  validated('abdias', 'Abdias', ['1R']),
  validated('elisee', 'Élisée', ['1R']),
  validated('nabucodonosor', 'Nabucodonosor', ['2R', 'Jr', 'Esd']),
  // Le Sédécias de Jr 29 est un faux prophète, pas le roi : on ne cherche que dans 2 R
  validated('sedecias', 'Sédécias', ['2R']),
  validated('godolias', 'Godolias', ['2R']),
  validated('jeremie', 'Jérémie', ['Jr']),
  validated('cyrus', 'Cyrus', ['Esd']),
  validated('zacharie', 'Zacharie', ['Lc']),
  validated('elisabeth', 'Élisabeth', ['Lc']),
  validated('gabriel', 'Gabriel', ['Lc']),
  // En Lc 24, les Marie sont Marie Madeleine et Marie, mère de Jacques
  validated('marie', 'Marie', ['Lc'], { notIn: ['resurrection-luc'] }),
  // En Lc 23, le Joseph est Joseph d'Arimathie
  validated('joseph-de-nazareth', 'Joseph de Nazareth', ['Lc'], { searchNames: ['Joseph'], notIn: ['passion'] }),
  // En Lc 22, le Jean est l'apôtre
  validated('jean-baptiste', 'Jean le Baptiste', ['Lc'], { searchNames: ['Jean'], notIn: ['passion'] }),
  validated('symeon', 'Syméon', ['Lc']),
  validated('anne', 'Anne', ['Lc']),
  validated('jesus', 'Jésus', ['Mt', 'Lc', 'Jn', 'Ac']),
  validated('pierre', 'Pierre', ['Lc', 'Jn', 'Ac']),
  validated('judas', 'Judas', ['Lc']),
  validated('pilate', 'Pilate', ['Lc']),
  // En Lc 1, l'Hérode est Hérode le Grand ; dans la Passion, Hérode Antipas
  validated('herode', 'Hérode Antipas', ['Lc'], { searchNames: ['Hérode'], notIn: ['annonciation-nativite'] }),
  validated('simon-de-cyrene', 'Simon de Cyrène', ['Lc'], { searchNames: ['Simon de Cyrène'] }),
  validated('joseph-d-arimathie', 'Joseph d\'Arimathie', ['Lc'], { searchNames: ['Arimathie'] }),
  validated('marie-madeleine', 'Marie Madeleine', ['Lc', 'Jn'], { searchNames: ['Madeleine'] }),
  validated('cleophas', 'Cléophas', ['Lc']),
  validated('thomas', 'Thomas', ['Jn']),
];
