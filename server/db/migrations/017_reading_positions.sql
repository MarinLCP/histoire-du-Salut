-- Migration 017 : la position de lecture automatique, à part du marque-page (2026-10-09).
-- Avant : un seul marque-page par lecture, qui suivait la lecture (verse_key NULL) ou était posé à la main.
-- Posé à la main, plus rien ne retenait où on lisait. Maintenant :
-- - user_reading_positions : où on en est dans chaque lecture, retenu en continu (la lecture y revient à
--   l'ouverture de l'app) ;
-- - user_bookmarks : seulement les marque-pages posés à la main (verse_key toujours rempli).
-- Les marque-pages qui suivaient la lecture deviennent des positions de lecture : personne ne perd la sienne.
-- NE JAMAIS modifier une migration déjà appliquée.

CREATE TABLE user_reading_positions (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode       TEXT NOT NULL CHECK (mode IN ('history', 'bible')), -- la lecture : histoire du salut ou Bible entière
  position   DOUBLE PRECISION NOT NULL CHECK (position >= 0),     -- la position de lecture continue (ex. 12.4)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),                  -- la plus récente gagne (plusieurs appareils)
  PRIMARY KEY (user_id, mode)
);

INSERT INTO user_reading_positions (user_id, mode, position, updated_at)
  SELECT user_id, mode, position, updated_at FROM user_bookmarks WHERE verse_key IS NULL;

DELETE FROM user_bookmarks WHERE verse_key IS NULL;

ALTER TABLE user_bookmarks ALTER COLUMN verse_key SET NOT NULL;
