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
  verse    TEXT,                    -- texte car l'AELF a "1a", "1b"... NULL si sans numéro
  kind     TEXT NOT NULL DEFAULT 'verse', -- 'verse' ou 'unnumbered' (ex. "ELLE" dans le Cantique)
  text     TEXT NOT NULL,
  position INTEGER NOT NULL UNIQUE, -- ordre de lecture global
  UNIQUE (book_id, chapter, verse),
  -- Garde-fou : un 'verse' a toujours un numéro, un 'unnumbered' jamais
  CHECK (
    (kind = 'verse' AND verse IS NOT NULL) OR
    (kind = 'unnumbered' AND verse IS NULL)
  )
);

-- Un passage = une plage continue de versets dans un livre.
CREATE TABLE IF NOT EXISTS passages (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  position      INTEGER NOT NULL UNIQUE, -- ordre dans le scroll
  title         TEXT NOT NULL,
  book_id       INTEGER NOT NULL REFERENCES books(id),
  start_chapter TEXT NOT NULL,
  start_verse   TEXT NOT NULL,
  end_chapter   TEXT NOT NULL,
  end_verse     TEXT NOT NULL
);
