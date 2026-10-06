-- Migration 012 : partager où on en est (V10.3). Les notes, elles, ne sont JAMAIS partagées.
-- - users.display_name : le pseudo affiché sur le lien de partage (jamais l'e-mail) ;
-- - progress_shares : le lien de partage d'un lecteur (un au plus). Le jeton, aléatoire, est l'adresse du lien
--   (/progression/<jeton>) : impossible à deviner ; « Arrêter de partager » supprime la ligne.
-- NE JAMAIS modifier une migration déjà appliquée.

ALTER TABLE users ADD COLUMN display_name TEXT CHECK (length(display_name) BETWEEN 2 AND 30);

CREATE TABLE progress_shares (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
