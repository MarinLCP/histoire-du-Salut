// Les grands ensembles de la Bible, dans l'ordre : le premier niveau de la frise en mode « Bible entière ».
// Découpage traditionnel des Bibles catholiques. Chaque ensemble va de firstBook à lastBook (codes AELF, inclus),
// dans l'ordre de lecture du site (Psaumes juste après Job). Ensembles à la suite, sans trou ni chevauchement.
// slug : identifiant fixe (minuscules, chiffres, tirets). icon : le nom de son pictogramme au trait.
// Après une modification : npm run seed (il vérifie ces règles avant d'écrire dans la base)

export const bibleGroups = [
  { slug: 'pentateuque', title: 'Le Pentateuque', icon: 'tablets', firstBook: 'Gn', lastBook: 'Dt' },
  { slug: 'historiques', title: 'Les livres historiques', icon: 'crown', firstBook: 'Jos', lastBook: '2M' },
  { slug: 'sapientiaux', title: 'Les livres poétiques et sapientiaux', icon: 'feather', firstBook: 'Jb', lastBook: 'Si' },
  { slug: 'prophetes', title: 'Les prophètes', icon: 'flame', firstBook: 'Is', lastBook: 'Ml' },
  { slug: 'evangiles', title: 'Les Évangiles', icon: 'cross', firstBook: 'Mt', lastBook: 'Jn' },
  { slug: 'actes', title: 'Les Actes des Apôtres', icon: 'wind', firstBook: 'Ac', lastBook: 'Ac' },
  { slug: 'epitres', title: 'Les épîtres', icon: 'letter', firstBook: 'Rm', lastBook: 'Jude' },
  { slug: 'apocalypse', title: "L'Apocalypse", icon: 'city', firstBook: 'Ap', lastBook: 'Ap' },
];
