-- Migration 005 (« contract ») : la fin du changement commencé par 003 et 004.
-- Le code lit désormais les passages par les id de leurs versets (déployé AVANT cette migration) :
-- les anciennes colonnes texte ne servent plus, et les nouvelles colonnes deviennent obligatoires.
-- Le livre d'un passage n'est plus stocké : c'est celui de son verset de début.
-- Prérequis : la base a été remplie par un seed qui connaît les époques (sinon le SET NOT NULL échoue).
-- NE JAMAIS modifier une migration déjà appliquée.

ALTER TABLE passages
  ALTER COLUMN epoch_id SET NOT NULL,
  ALTER COLUMN icon SET NOT NULL,
  ALTER COLUMN start_verse_id SET NOT NULL,
  ALTER COLUMN end_verse_id SET NOT NULL,
  DROP COLUMN book_id,
  DROP COLUMN start_chapter,
  DROP COLUMN start_verse,
  DROP COLUMN end_chapter,
  DROP COLUMN end_verse;

ALTER TABLE books ALTER COLUMN group_id SET NOT NULL;
