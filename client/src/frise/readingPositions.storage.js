// Où le lecteur en est dans chaque lecture, sur cet appareil (la lecture y revient à l'ouverture de l'app).
// Format (version 1) : { "version": 1, "readings": { "history": { "position": 12.4, "savedAt": "2026-10-09T…" } } }
// - position : la position de lecture continue (ex. 12.4 = dans l'épisode n° 12) ;
// - savedAt : quand (avec un compte, la position la plus récente gagne, d'un appareil à l'autre).
// Gardée même avec un compte (ce n'est pas une donnée privée comme les notes) : l'app la retrouve tout de suite
// à l'ouverture, sans attendre le serveur.
// Avant, c'était le marque-page qui suivait la lecture (bookmarks, versions 1 et 2) : il est relu, une fois.

import { createVersionedStorage } from '../storage/versionedStorage.js';

const storage = createVersionedStorage('readings', 1);
const bookmarksV1 = createVersionedStorage('bookmarks', 1);
const bookmarksV2 = createVersionedStorage('bookmarks', 2);
// La date des positions relues de l'ancien format (inconnue) : toute autre est plus récente
const LONG_AGO = '1970-01-01T00:00:00.000Z';

export function loadReadingPositions() {
  const readings = storage.load();
  if (readings.size > 0) return readings;
  const followed = [
    ...bookmarksV1.load(),
    ...[...bookmarksV2.load()].filter(([, bookmark]) => bookmark?.verse == null).map(([mode, bookmark]) => [mode, bookmark?.position]),
  ];
  return new Map(followed.filter(([, position]) => typeof position === 'number')
    .map(([mode, position]) => [mode, { position, savedAt: LONG_AGO }]));
}

// mode : 'history' ou 'bible' ; renvoie ce qui est retenu : { position, savedAt }
export function saveReadingPosition(mode, position) {
  const reading = { position, savedAt: new Date().toISOString() };
  const readings = loadReadingPositions();
  readings.set(mode, reading);
  storage.save(readings);
  return reading;
}
