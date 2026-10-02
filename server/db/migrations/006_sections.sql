-- Migration 006 : les sous-chapitres, des intertitres posés sur le verset où ils commencent.
-- Un sous-chapitre va jusqu'au suivant. Remplie par le seed (db/sections.data.js).
-- NE JAMAIS modifier une migration déjà appliquée.

CREATE TABLE sections (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  start_verse_id INTEGER NOT NULL UNIQUE REFERENCES verses(id), -- un seul intertitre par verset
  title          TEXT NOT NULL CHECK (title <> '')
);
