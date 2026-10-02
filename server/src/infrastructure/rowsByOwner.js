// Range des lignes SQL « propriétaire + données » dans une Map : id du propriétaire -> ses lignes, dans l'ordre.
// Sert à charger en UNE requête les versets (ou les personnages) de plusieurs passages ou chapitres.
// ownerColumn : la colonne qui porte l'id du propriétaire (ex. "passage_id"), retirée de chaque ligne.
// Chaque id demandé a sa liste, même vide.
export function rowsByOwner(ids, rows, ownerColumn) {
  const owned = new Map(ids.map((id) => [id, []]));
  for (const { [ownerColumn]: ownerId, ...row } of rows) {
    owned.get(ownerId).push(row);
  }
  return owned;
}
