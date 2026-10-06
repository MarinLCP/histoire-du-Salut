-- Migration 008 : les parallèles (OpenBible.info, licence CC-BY) : un verset renvoie à un verset ou à une
-- plage de versets, avec le nombre de votes des lecteurs d'OpenBible (seulement les votes positifs).
-- Remplie par le seed (data/cross-references.zip, converti en références AELF par scripts/parallels/).
-- NE JAMAIS modifier une migration déjà appliquée.

CREATE TABLE parallels (
  from_verse_id     INTEGER NOT NULL REFERENCES verses(id), -- le verset lu
  to_start_verse_id INTEGER NOT NULL REFERENCES verses(id), -- le verset parallèle (début de la plage)
  to_end_verse_id   INTEGER NOT NULL REFERENCES verses(id), -- fin de la plage (= début pour un seul verset)
  votes             INTEGER NOT NULL CHECK (votes > 0),
  PRIMARY KEY (from_verse_id, to_start_verse_id, to_end_verse_id)
);

-- Pour « les parallèles d'un verset, les plus votés d'abord »
CREATE INDEX parallels_by_verse ON parallels (from_verse_id, votes DESC);
