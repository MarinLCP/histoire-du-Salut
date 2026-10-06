-- Migration 011 : ce que chaque lecteur garde dans son compte : ses notes (privées), ses surlignages et ses
-- marque-pages (un par lecture). Les versets sont désignés par leur référence en texte ("Gn 1,3"), comme dans
-- le navigateur, et PAS par verses.id : le seed vide et recharge les versets, il ne doit jamais toucher aux comptes.
-- ON DELETE CASCADE : supprimer un compte supprime tout ce qu'il contient.
-- NE JAMAIS modifier une migration déjà appliquée.

CREATE TABLE user_notes (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verse_key  TEXT NOT NULL CHECK (length(verse_key) BETWEEN 1 AND 40),
  text       TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 10000),
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, verse_key)
);

CREATE TABLE user_highlights (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verse_key  TEXT NOT NULL CHECK (length(verse_key) BETWEEN 1 AND 40),
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, verse_key)
);

CREATE TABLE user_bookmarks (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode       TEXT NOT NULL CHECK (mode IN ('history', 'bible')), -- la lecture : histoire du salut ou Bible entière
  position   DOUBLE PRECISION NOT NULL CHECK (position >= 0),     -- la position de lecture continue (ex. 12.4)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mode)
);
