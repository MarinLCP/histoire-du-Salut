// Les époques de l'histoire du salut, dans l'ordre : le premier niveau de la frise (un bloc par époque).
// Chaque passage de passages.data.js dit à quelle époque il appartient (champ epoch = le slug ci-dessous).
// slug : identifiant fixe (minuscules, chiffres, tirets). Ne pas le changer sans changer aussi passages.data.js.
// icon : le nom de son pictogramme au trait (dessiné par le site).
// Après une modification : npm run seed

export const epochs = [
  { slug: 'origines', title: 'Les origines', icon: 'sun' },
  { slug: 'patriarches', title: 'Les patriarches', icon: 'tent' },
  { slug: 'exode', title: "L'Exode et l'Alliance", icon: 'tablets' },
  { slug: 'terre-promise', title: 'La Terre promise', icon: 'walls' },
  { slug: 'royaute', title: 'La royauté', icon: 'crown' },
  { slug: 'prophetes', title: 'Les prophètes', icon: 'feather' },
  { slug: 'exil', title: "L'Exil et le retour", icon: 'road' },
  { slug: 'jesus', title: 'Jésus', icon: 'cross' },
  { slug: 'eglise', title: "L'Église", icon: 'wind' },
  { slug: 'accomplissement', title: "L'accomplissement", icon: 'city' },
];
