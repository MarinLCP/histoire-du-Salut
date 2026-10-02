-- Migration 004 (« expand ») : les grands ensembles de la Bible (Pentateuque, livres historiques...),
-- et le grand ensemble de chaque livre. Colonne books.group_id FACULTATIVE pour l'instant :
-- le site marche avant comme après cette migration ; la migration « contract » la rendra obligatoire.
-- Remplie par le seed (db/bible-groups.data.js). NE JAMAIS modifier une migration déjà appliquée.

CREATE TABLE bible_groups (
  id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug     TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), -- ex. "pentateuque"
  title    TEXT NOT NULL,                                                    -- ex. "Le Pentateuque"
  icon     TEXT NOT NULL,                                                    -- nom du pictogramme, ex. "tablets"
  position INTEGER NOT NULL UNIQUE                                           -- ordre dans la Bible
);

ALTER TABLE books ADD COLUMN group_id INTEGER REFERENCES bible_groups(id);
