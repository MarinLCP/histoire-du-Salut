-- Migration 007 : les personnages, et leurs apparitions dans les épisodes.
-- Les apparitions sont calculées par le seed (recherche des noms dans le texte de chaque épisode).
-- Remplie par le seed (db/characters.data.js). NE JAMAIS modifier une migration déjà appliquée.

CREATE TABLE characters (
  id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug     TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), -- ex. "joseph-de-nazareth"
  name     TEXT NOT NULL CHECK (name <> ''),                                 -- ex. "Joseph de Nazareth"
  position INTEGER NOT NULL UNIQUE                                           -- ordre d'affichage
);

-- Un personnage apparaît dans un épisode : combien de fois son nom y est écrit
CREATE TABLE passage_characters (
  passage_id   INTEGER NOT NULL REFERENCES passages(id),
  character_id INTEGER NOT NULL REFERENCES characters(id),
  mentions     INTEGER NOT NULL CHECK (mentions > 0),
  PRIMARY KEY (passage_id, character_id)
);
