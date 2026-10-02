-- Migration 002 : la liste des chapitres, dans l'ordre de lecture de toute la Bible.
-- Elle permet de lire la Bible en continu, chapitre après chapitre (pagination par curseur sur position).
-- Remplie par le seed à partir des versets. NE JAMAIS modifier une migration déjà appliquée.

CREATE TABLE chapters (
  id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_id  INTEGER NOT NULL REFERENCES books(id),
  label    TEXT NOT NULL,             -- le numéro, en texte comme dans l'AELF ("1", "9A", "113B")
  position INTEGER NOT NULL UNIQUE,   -- ordre de lecture dans toute la Bible
  UNIQUE (book_id, label)
);
