-- Migration 010 : les comptes des lecteurs et leurs sessions (connexion faite maison, sans dépendance).
-- - users : l'e-mail (en minuscules, unique) et le mot de passe HACHÉ (scrypt) : jamais le mot de passe lui-même ;
-- - sessions : une connexion ouverte. Le navigateur garde un jeton secret (cookie) ; la base n'en garde que
--   l'empreinte (SHA-256) : une copie volée de la base ne permet pas de se faire passer pour un lecteur.
-- ON DELETE CASCADE : supprimer un compte supprime aussi ses sessions.
-- NE JAMAIS modifier une migration déjà appliquée.

CREATE TABLE users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND email LIKE '%_@_%'),
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,                                         -- SHA-256 du jeton, en hexadécimal
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX sessions_by_user ON sessions (user_id);
