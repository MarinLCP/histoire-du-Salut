-- Migration 003 (« expand ») : les époques de l'histoire du salut, le pictogramme de chaque épisode,
-- et chaque passage relié directement à ses versets de début et de fin (par leur id).
-- Les nouvelles colonnes sont FACULTATIVES pour l'instant : le code en ligne lit encore les anciennes
-- colonnes texte (start_chapter...), et le site marche avant comme après cette migration.
-- Une migration « contract » les rendra obligatoires et supprimera les anciennes colonnes.
-- Remplie par le seed. NE JAMAIS modifier une migration déjà appliquée.

CREATE TABLE epochs (
  id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug     TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), -- ex. "patriarches"
  title    TEXT NOT NULL,                                                    -- ex. "Les patriarches"
  icon     TEXT NOT NULL,                                                    -- nom du pictogramme, ex. "tent"
  position INTEGER NOT NULL UNIQUE                                           -- ordre dans l'histoire
);

ALTER TABLE passages
  ADD COLUMN epoch_id       INTEGER REFERENCES epochs(id),
  ADD COLUMN icon           TEXT,
  ADD COLUMN start_verse_id INTEGER REFERENCES verses(id),
  ADD COLUMN end_verse_id   INTEGER REFERENCES verses(id);
