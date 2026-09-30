-- Migration 001 : schéma initial (livres, versets, passages).
-- Appliquée une seule fois par npm run db:migrate. NE JAMAIS modifier une migration déjà appliquée
-- (en local ou en ligne) : pour changer le schéma, créer une nouvelle migration 002_..., 003_...

CREATE TABLE books (
  id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code     TEXT NOT NULL UNIQUE,   -- ex. "Gn"
  title    TEXT NOT NULL,          -- ex. "La Genèse"
  position INTEGER NOT NULL UNIQUE -- ordre dans la Bible
);

CREATE TABLE verses (
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
CREATE TABLE passages (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  position      INTEGER NOT NULL UNIQUE, -- ordre dans le scroll
  -- Identifiant fixe, utilisé dans les liens partagés (ex. "creation")
  slug          TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         TEXT NOT NULL,
  book_id       INTEGER NOT NULL REFERENCES books(id),
  start_chapter TEXT NOT NULL,
  start_verse   TEXT NOT NULL,
  end_chapter   TEXT NOT NULL,
  end_verse     TEXT NOT NULL
);
