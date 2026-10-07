-- Migration 016 : le marque-page posé à la main (V11.1b, étape 6).
-- user_bookmarks.verse_key : le verset où le lecteur l'a posé ("Gn 1,3") ; NULL = il suit la lecture (comme
-- avant). Posé à la main, il ne bouge plus tout seul : la lecture ne le déplace pas, même sur un autre appareil.
-- NE JAMAIS modifier une migration déjà appliquée.

ALTER TABLE user_bookmarks ADD COLUMN verse_key TEXT;
