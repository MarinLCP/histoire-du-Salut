-- Migration 014 : valider l'adresse e-mail d'un compte par un code (V10.5c).
-- - users.email_verified_at : quand l'e-mail a été validé ; vide = compte pas encore validé (pas de session).
--   Les comptes qui existent déjà sont considérés comme validés (ils ont été créés avant cette règle) ;
-- - email_codes : le code envoyé par e-mail (un par compte au plus), rangé HACHÉ, avec son expiration et le
--   nombre d'essais déjà faits (5 au plus).
-- NE JAMAIS modifier une migration déjà appliquée.

ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
UPDATE users SET email_verified_at = created_at;

CREATE TABLE email_codes (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code_hash  TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);
