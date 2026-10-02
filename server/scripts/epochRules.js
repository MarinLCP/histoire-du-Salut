// Règles des époques (db/epochs.data.js) et de leur lien avec les passages (db/passages.data.js).
// Fonction pure, appelée par le seed AVANT de toucher à la base (message clair au premier problème).
// La frise dessine chaque époque comme un bloc : ses épisodes doivent donc se suivre, dans l'ordre des époques.

import { isDataIdentifier } from './dataIdentifier.js';

export function validateEpochs(epochs, passages) {
  const slugs = epochs.map((epoch) => epoch.slug);

  epochs.forEach((epoch, index) => validateEpoch(epoch, index, slugs));
  validatePassageEpochs(passages, slugs);
  requireEpisodes(epochs, passages);
}

// index : sa place dans la liste ; un slug déjà vu plus haut est un doublon
function validateEpoch(epoch, index, slugs) {
  const where = `Époque "${epoch.title}"`;
  if (!isDataIdentifier(epoch.slug)) throw new Error(`${where} : slug "${epoch.slug}" mal formé.`);
  if (slugs.indexOf(epoch.slug) !== index) throw new Error(`${where} : slug "${epoch.slug}" déjà utilisé.`);
  if (!isDataIdentifier(epoch.icon)) throw new Error(`${where} : pictogramme "${epoch.icon}" mal formé.`);
}

// L'époque d'un passage ne revient jamais en arrière : ses épisodes se suivent, dans l'ordre des époques
function validatePassageEpochs(passages, epochOrder) {
  let previousIndex = 0;

  for (const passage of passages) {
    const index = requireEpochIndex(passage, epochOrder);
    if (index < previousIndex) {
      throw new Error(`Passage "${passage.title}" : époque "${passage.epoch}" après "${epochOrder[previousIndex]}"`
        + " (les épisodes suivent l'ordre des époques).");
    }
    previousIndex = index;
  }
}

function requireEpochIndex(passage, epochOrder) {
  const index = epochOrder.indexOf(passage.epoch);
  if (index === -1) throw new Error(`Passage "${passage.title}" : époque "${passage.epoch}" introuvable.`);
  return index;
}

function requireEpisodes(epochs, passages) {
  const epochsWithEpisodes = new Set(passages.map((passage) => passage.epoch));
  const empty = epochs.find((epoch) => !epochsWithEpisodes.has(epoch.slug));
  if (empty) throw new Error(`Époque "${empty.title}" : aucun épisode.`);
}
