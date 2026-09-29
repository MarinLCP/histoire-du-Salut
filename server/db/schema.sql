-- Schéma de la base : les livres de la Bible et leurs versets.
-- IF NOT EXISTS permet de relancer ce fichier sans erreur.

CREATE TABLE IF NOT EXISTS books (
  id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code     TEXT NOT NULL UNIQUE,   -- ex. "Gn"
  title    TEXT NOT NULL,          -- ex. "La Genèse"
  position INTEGER NOT NULL UNIQUE -- ordre dans la Bible
);

CREATE TABLE IF NOT EXISTS verses (
  id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_id  INTEGER NOT NULL REFERENCES books(id),
  chapter  TEXT NOT NULL,           -- texte car l'AELF a "9A", "113B"...
  verse    TEXT NOT NULL,           -- texte car l'AELF a "1a", "1b"...
  text     TEXT NOT NULL,
  position INTEGER NOT NULL UNIQUE, -- ordre de lecture global
  UNIQUE (book_id, chapter, verse)
);
