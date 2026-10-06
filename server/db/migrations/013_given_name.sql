-- Migration 013 : le pseudo est retiré (décision de Marin, 2026-10-07). Le lien de partage montre à la place le
-- prénom donné par Google quand le lecteur se connecte avec Google (V10.5d) ; un compte e-mail n'a pas de nom.
-- NE JAMAIS modifier une migration déjà appliquée.

ALTER TABLE users DROP COLUMN display_name;
ALTER TABLE users ADD COLUMN given_name TEXT CHECK (length(given_name) BETWEEN 1 AND 100);
