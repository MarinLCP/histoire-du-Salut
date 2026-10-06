-- Migration 009 : retire l'index parallels_by_verse (migration 008), qui ne servait à rien : la clé primaire
-- commence déjà par from_verse_id (elle trouve les parallèles d'un verset), et le tri « plus votés, puis
-- ordre de la Bible » se fait de toute façon sur les versets joints. Environ 10 Mo de gagnés en ligne.
-- NE JAMAIS modifier une migration déjà appliquée.

DROP INDEX parallels_by_verse;
