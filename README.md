# Histoire du Salut

Application pour lire et parcourir la Bible et l'histoire du salut.

## Structure

- `server/` : API (Node.js) qui lit la base `server/data/bible.db`
- `client/` : interface web

## Données

`server/data/bible.db` est une base SQLite qui contient 74 livres, 1 332 chapitres et 35 480 versets :

- `verses` : un verset par ligne (livre, chapitre, verset, texte)
- `chapters` : vue qui regroupe les versets par chapitre
- `search` : index plein texte (FTS5)
