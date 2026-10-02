// Le statut d'une donnée proposée par Claude : « proposé » tant que Marin ne l'a pas relue, puis « validé ».
// Règle : en ligne (npm run seed:prod), seules les données validées sont écrites. Sur le Mac et dans la CI,
// tout est écrit, pour pouvoir voir et tester les propositions.

const STATUSES = ['proposé', 'validé'];

// where : ce que désigne la donnée dans le message d'erreur (ex. 'Sous-chapitre "Le jardin"')
export function validateStatus(item, where) {
  if (!STATUSES.includes(item.status)) {
    throw new Error(`${where} : statut "${item.status}" inconnu (proposé ou validé).`);
  }
}

// Les données à écrire dans la base : toutes, ou seulement les validées (en ligne)
export function publishable(items, { withProposals }) {
  if (withProposals) return items;
  return items.filter((item) => item.status === 'validé');
}
