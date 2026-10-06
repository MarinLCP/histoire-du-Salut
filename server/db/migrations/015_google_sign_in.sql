-- Migration 015 : se connecter avec Google (V10.5d).
-- - users.password_hash devient facultatif : un compte créé avec Google n'a pas de mot de passe ;
-- - users.google_sub : l'identifiant du lecteur chez Google (« sub »), unique et stable (plus fiable que
--   l'e-mail, qui peut changer chez Google).
-- NE JAMAIS modifier une migration déjà appliquée.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN google_sub TEXT UNIQUE;
