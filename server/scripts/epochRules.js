// Règles des époques (db/epochs.data.js) et de leur lien avec les passages (db/passages.data.js).
// Fonction pure, appelée par le seed AVANT de toucher à la base (message clair au premier problème).
// La frise dessine chaque époque comme un bloc : ses épisodes doivent donc se suivre, dans l'ordre des époques.

import { validateSlugList } from './dataIdentifier.js';

export function validateEpochs(epochs, passages) {
  validateSlugList(epochs, 'Époque');
  validatePassageEpochs(passages, epochs.map((epoch) => epoch.slug));
  requireEpisodes(epochs, passages);
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
