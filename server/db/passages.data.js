// Les passages du scroll, dans l'ordre de l'histoire du salut.
// Uniquement des références (pas de texte biblique) : le texte vient de la table verses.
// slug : identifiant fixe du passage, utilisé dans les liens partagés (?passage=creation).
//   Ne JAMAIS le changer une fois le site en ligne : les liens déjà partagés ne marcheraient plus.
//   Minuscules, chiffres et tirets uniquement.
// start et end = [chapitre, verset], bornes incluses, en TEXTE comme dans la Bible AELF
//   (certains versets ont une lettre, ex. ['9A', '1a']).
// Après une modification : npm run seed

export const passages = [
  { slug: 'creation', title: 'La Création', book: 'Gn', start: ['1', '1'], end: ['2', '25'] },
  { slug: 'chute', title: 'La chute', book: 'Gn', start: ['3', '1'], end: ['3', '24'] },
  { slug: 'noe', title: "Noé, le déluge et l'alliance", book: 'Gn', start: ['6', '1'], end: ['9', '29'] },
  { slug: 'appel-abraham', title: "L'appel d'Abraham", book: 'Gn', start: ['12', '1'], end: ['12', '20'] },
  { slug: 'alliance-abraham', title: "L'alliance avec Abraham", book: 'Gn', start: ['15', '1'], end: ['15', '21'] },
  { slug: 'sacrifice-isaac', title: "Le sacrifice d'Isaac", book: 'Gn', start: ['22', '1'], end: ['22', '24'] },
  { slug: 'joseph-vendu', title: 'Joseph vendu par ses frères', book: 'Gn', start: ['37', '1'], end: ['37', '36'] },
  { slug: 'joseph-reconnu', title: 'Joseph se fait reconnaître', book: 'Gn', start: ['45', '1'], end: ['45', '28'] },
  { slug: 'buisson-ardent', title: 'Le buisson ardent', book: 'Ex', start: ['3', '1'], end: ['3', '22'] },
  { slug: 'paque', title: 'La Pâque', book: 'Ex', start: ['12', '1'], end: ['12', '51'] },
  { slug: 'traversee-mer', title: 'La traversée de la mer', book: 'Ex', start: ['14', '1'], end: ['14', '31'] },
  { slug: 'sinai', title: "L'alliance du Sinaï et le Décalogue", book: 'Ex', start: ['19', '1'], end: ['20', '26'] },
  { slug: 'jourdain', title: 'La traversée du Jourdain', book: 'Jos', start: ['3', '1'], end: ['3', '17'] },
  { slug: 'jericho', title: 'La prise de Jéricho', book: 'Jos', start: ['6', '1'], end: ['6', '27'] },
  { slug: 'un-roi', title: 'Le peuple réclame un roi', book: '1S', start: ['8', '1'], end: ['10', '27'] },
  { slug: 'david-goliath', title: "David, l'onction et Goliath", book: '1S', start: ['16', '1'], end: ['17', '58'] },
  { slug: 'dynastie-david', title: "La promesse d'une dynastie", book: '2S', start: ['7', '1'], end: ['7', '29'] },
  { slug: 'sagesse-salomon', title: 'La sagesse de Salomon', book: '1R', start: ['3', '1'], end: ['3', '28'] },
  { slug: 'temple', title: 'La dédicace du Temple', book: '1R', start: ['8', '1'], end: ['8', '66'] },
  { slug: 'elie-carmel', title: 'Élie et le Carmel', book: '1R', start: ['17', '1'], end: ['19', '21'] },
  { slug: 'vocation-isaie', title: "La vocation d'Isaïe", book: 'Is', start: ['6', '1'], end: ['6', '13'] },
  { slug: 'serviteur-souffrant', title: 'Le Serviteur souffrant', book: 'Is', start: ['52', '13'], end: ['53', '12'] },
  { slug: 'chute-jerusalem', title: 'La chute de Jérusalem', book: '2R', start: ['25', '1'], end: ['25', '30'] },
  { slug: 'lettre-exiles', title: 'La lettre aux exilés', book: 'Jr', start: ['29', '1'], end: ['29', '32'] },
  { slug: 'retour-exil', title: "Le retour d'exil", book: 'Esd', start: ['1', '1'], end: ['1', '11'] },
  { slug: 'annonciation-nativite', title: 'Annonciation et Nativité', book: 'Lc', start: ['1', '1'], end: ['2', '52'] },
  { slug: 'beatitudes', title: 'Les Béatitudes', book: 'Mt', start: ['5', '1'], end: ['5', '48'] },
  { slug: 'passion', title: 'La Passion', book: 'Lc', start: ['22', '1'], end: ['23', '56'] },
  { slug: 'resurrection-luc', title: 'La Résurrection selon Luc', book: 'Lc', start: ['24', '1'], end: ['24', '53'] },
  { slug: 'resurrection-jean', title: 'La Résurrection selon Jean', book: 'Jn', start: ['20', '1'], end: ['20', '31'] },
  { slug: 'pentecote', title: 'La Pentecôte', book: 'Ac', start: ['2', '1'], end: ['2', '47'] },
  { slug: 'nouvelle-creation', title: 'La nouvelle création', book: 'Ap', start: ['21', '1'], end: ['21', '27'] },
];
