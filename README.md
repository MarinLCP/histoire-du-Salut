# L'histoire d'un Salut

[![CI](https://github.com/MarinLCP/histoire-du-Salut/actions/workflows/ci.yml/badge.svg)](https://github.com/MarinLCP/histoire-du-Salut/actions/workflows/ci.yml)

🌐 **En ligne : https://histoire-du-salut.onrender.com**

App web de scroll infini pour lire la Bible dans l'ordre de l'histoire du salut :
32 grands passages, de la Création à Ap 21. Un appui long sur un verset ouvre un menu : le surligner, y ajouter une note, le copier.
Chaque passage se partage par un lien direct (`/?passage=creation`).

Monorepo : `server/` (API Node + Express + PostgreSQL) et `client/` (React + Vite).
Chaque dossier a son propre `package.json` : `npm install` se fait dans chacun.

## Démarrer en local

Prérequis : Node 24, PostgreSQL (ex. Postgres.app).

```bash
# 1. L'API et la base (une seule fois)
cd server
npm install
cp .env.example .env       # puis remplir DATABASE_URL
createdb histoire_du_salut
npm run db:migrate         # crée les tables (applique les migrations)
npm run seed               # remplit les tables (rejouable)

# 2. Lancer l'app : deux terminaux
cd server && npm run dev   # API sur http://localhost:3000
cd client && npm run dev   # site sur http://localhost:5173 (dev:mobile pour le téléphone)
```

Tests : `npm test` dans `server/` (API) et dans `client/` (logique et composants).

Tests de bout en bout (vrai navigateur, ordinateur + iPhone simulé) : `cd e2e && npm install && npx playwright install chromium webkit`
la première fois, puis `npm test` (démarre l'API et le site s'ils ne tournent pas). `npm run report` montre le détail d'un échec.

## Intégration continue (CI)

À chaque `git push`, GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) lance sur des machines neuves :

- **serveur** : un PostgreSQL 18 jetable, `db:migrate`, `seed`, puis les tests ;
- **client** : lint, tests, build ;
- **e2e** : l'app complète (API + site + PostgreSQL jetable) parcourue par Playwright, sur Chrome et iPhone/Safari.
  En cas d'échec, le rapport (captures, traces) est à télécharger en bas de la page du run (*Artifacts*).

Render ne déploie que si les trois jobs sont verts.

Le résultat s'affiche dans l'onglet **Actions** du dépôt et en ✅ / ❌ à côté de chaque commit (et sur le badge en haut).

## Faire évoluer la base (migrations)

Ne jamais modifier une migration déjà appliquée. Pour changer le schéma :

1. Créer le fichier suivant dans `server/db/migrations/`, ex. `002_add_explanations.sql` (3 chiffres, `_`, un nom en minuscules).
2. Y écrire le SQL du changement (`ALTER TABLE ...`, `CREATE TABLE ...`).
3. Lancer `npm run db:migrate` : seules les nouvelles migrations sont appliquées (la table `schema_migrations` retient les autres).
4. En ligne, rien à faire : Render lance `npm run db:migrate` à chaque démarrage, avant le serveur.
   Si une migration échoue, le serveur ne démarre pas et Render garde l'ancienne version en ligne.

## Mise en ligne (Render)

En production, un seul serveur : Express envoie l'API **et** le site React construit (`client/dist`).

**1. Remplir la base Render depuis son Mac** (la première fois, puis à chaque changement d'un fichier de données `server/db/*.data.js`)

Créer `server/.env.production` (ignoré par Git, ne jamais le commiter) avec l'**External Database URL** de Render,
suivie de `?sslmode=verify-full` :

```
DATABASE_URL=postgresql://...render.com/...?sslmode=verify-full
```

```bash
cd server
npm run db:migrate:prod    # crée les tables sur Render (ensuite, Render le fait seul à chaque démarrage)
npm run seed:prod          # remplit la base Render depuis bible.db
```

**2. Créer le Web Service sur Render** (New → Web Service → ce dépôt GitHub)

| Réglage | Valeur |
|---|---|
| Region | la même que la base |
| Root Directory | *(vide)* |
| Build Command | `cd client && npm ci --include=dev && npm run build && cd ../server && npm ci --omit=dev` |
| Start Command | `cd server && npm run db:migrate && npm start` |
| Health Check Path | `/api/health` |
| Auto-Deploy | `After CI Checks Pass` : Render attend que la CI soit verte pour déployer |
| Variable `DATABASE_URL` | l'**Internal Database URL** de Render (réseau privé, sans SSL) |
| Variable `NODE_ENV` | `production` |

La version de Node est fixée par le fichier `.node-version` (24).
Chaque `git push` sur `main` redéploie le site, **seulement si la CI est verte** : sinon l'ancienne version reste en ligne.

## Arborescence

```
histoire-du-Salut/
├── README.md                        ← ce fichier
├── .github/workflows/ci.yml         ← CI : serveur, client et e2e à chaque push (GitHub Actions)
├── .node-version                    ← version de Node utilisée par Render (24)
│
├── server/                          ← API (Node + Express + PostgreSQL)
│   ├── .env.example                 ← modèle du fichier .env (DATABASE_URL)
│   │                                  (.env et .env.production : jamais commités)
│   ├── vitest.config.js             ← charge .env pour les tests
│   ├── data/
│   │   └── bible.db                 ← source des textes (SQLite, AELF), lue par le seed
│   ├── db/
│   │   ├── migrations/              ← l'historique du schéma, appliqué dans l'ordre
│   │   │   ├── 001_initial_schema.sql ← tables books, verses, passages
│   │   │   ├── 002_chapters.sql     ← les chapitres dans l'ordre de lecture (Bible entière en continu)
│   │   │   ├── 003_epochs_and_verse_links.sql ← époques, pictogrammes, passages reliés à leurs versets (expand)
│   │   │   ├── 004_bible_groups.sql ← les grands ensembles de la Bible, et celui de chaque livre (expand)
│   │   │   └── 005_contract_passages.sql ← fin du changement : passages = versets de début et de fin (contract)
│   │   ├── bible-groups.data.js     ← les 8 grands ensembles (Pentateuque... Apocalypse) : premier et dernier livre
│   │   ├── epochs.data.js           ← les 10 époques de l'histoire du salut (slug, titre, pictogramme)
│   │   └── passages.data.js         ← les 32 passages (slug, références, époque, pictogramme) : à modifier ici
│   ├── scripts/
│   │   ├── migrate.js               ← npm run db:migrate : applique les nouvelles migrations
│   │   ├── migrations.js            ← règle : quelles migrations restent à appliquer
│   │   ├── passageRules.js          ← règles d'un passage (slug, livre, bornes, pictogramme) : le seed s'arrête avant la base
│   │   ├── epochRules.js            ← règles des époques (chaque époque a ses épisodes, à la suite, dans l'ordre)
│   │   ├── bibleGroupRules.js       ← grands ensembles : à la suite, sans trou ni chevauchement, tous les livres
│   │   ├── dataIdentifier.js        ← listes des fichiers de données : slugs et pictogrammes bien formés, uniques
│   │   ├── bibleOrder.js            ← ordre des livres (Psaumes après Job), des chapitres et des versets
│   │   ├── database.js              ← connexion et transaction des scripts (seed, migrations)
│   │   ├── sqlRows.js               ← petites règles d'écriture du seed ($1, $2... ; verset sans numéro)
│   │   └── seed.js                  ← npm run seed : bible.db + fichiers de données (db/*.data.js) → PostgreSQL
│   ├── src/                         ← Clean Architecture : les dépendances pointent vers domain/
│   │   ├── index.js                 ← démarre le serveur (app.listen)
│   │   ├── app.js                   ← assemblage : branche PostgreSQL → use cases → Express
│   │   ├── domain/                  ← règles métier pures (ni Express, ni PostgreSQL)
│   │   │   ├── identifier.js        ← règle commune des identifiants (slugs, pictogrammes)
│   │   │   ├── PassageSlug.js       ← value object : slug bien formé (API et seed)
│   │   │   ├── PageRequest.js       ← value object : page de timeline valide (after, limit ≤ 20)
│   │   │   ├── overviewNode.js      ← un nœud de la frise (même forme à tous les niveaux), groupBy
│   │   │   ├── historyOverview.js   ← arbre Histoire : époques → épisodes → chapitres couverts (« à partir du v. 13 »)
│   │   │   ├── bibleOverview.js     ← arbre Bible : ensembles → livres → dizaines (> 15 chapitres) → chapitres
│   │   │   ├── PassageRepository.js ← port : contrat de lecture des passages (JSDoc)
│   │   │   ├── BibleRepository.js   ← port : contrat de lecture de la Bible entière (livres, chapitres)
│   │   │   └── errors.js            ← ValidationError, NotFoundError
│   │   ├── application/             ← use cases : orchestrent le domaine (repository injecté)
│   │   │   ├── getPassage.js
│   │   │   ├── getTimeline.js
│   │   │   ├── readBible.js         ← la Bible en continu, chapitre après chapitre
│   │   │   ├── findChapter.js       ← position d'un chapitre (ouvrir la Bible au bon endroit)
│   │   │   ├── getHistoryOverview.js ← vue d'ensemble de la frise, mode Histoire du salut
│   │   │   └── getBibleOverview.js  ← vue d'ensemble de la frise, mode Bible entière
│   │   ├── infrastructure/          ← le seul endroit qui connaît PostgreSQL
│   │   │   ├── db.js                ← connexion (pool) + pingDatabase
│   │   │   ├── postgresPassageRepository.js ← tout le SQL des passages
│   │   │   ├── postgresBibleRepository.js   ← tout le SQL de la Bible entière
│   │   │   └── verseColumns.js      ← les colonnes d'un verset, partagées par les deux repositories
│   │   └── http/                    ← le seul endroit qui connaît Express
│   │       ├── createApp.js         ← routes /api/health, /api/passages/:slug, /api/timeline, /api/bible,
│   │       │                          /api/books/:code/chapters/:chapter, /api/overview/history, /api/overview/bible
│   │       │                          + site React construit (prod) + SPA fallback (/bible → index.html)
│   │       └── errorHandler.js      ← erreurs métier → 400 / 404
│   └── test/                        ← en miroir de src/ et scripts/
│       ├── domain/                  ← identifier, PassageSlug, PageRequest, arbres de la frise (unitaires, sans base)
│       ├── application/             ← getPassage, getTimeline, readBible, findChapter, vues d'ensemble (faux repository)
│       ├── http/                    ← l'API de bout en bout (supertest + base de dev)
│       │   ├── health.test.js       ← GET /api/health (base OK / base injoignable)
│       │   ├── passages.test.js     ← GET /api/passages/:slug (indépendant du contenu)
│       │   ├── spaFallback.test.js  ← les adresses du site renvoient index.html, pas l'API
│       │   ├── bible.test.js        ← GET /api/bible (74 livres, sans trou ni doublon), position d'un chapitre
│       │   ├── overview.test.js     ← GET /api/overview/history et /bible (comparés aux fichiers de données)
│       │   └── timeline.test.js     ← GET /api/timeline (dont la fin de la timeline)
│       ├── db/
│       │   └── seededData.test.js   ← ce que le seed a écrit (époques, pictogrammes, versets, grands ensembles)
│       └── scripts/
│           ├── migrations.test.js   ← choix des migrations à appliquer
│           ├── database.test.js     ← COMMIT / ROLLBACK, connexion toujours fermée (faux client)
│           ├── sqlRows.test.js      ← numérotation des paramètres, verset sans numéro
│           ├── passageRules.test.js ← règles de passages.data.js (vérifiées avant le seed)
│           ├── epochRules.test.js   ← règles de epochs.data.js et de leur lien avec les passages
│           ├── bibleGroupRules.test.js ← découpage de la Bible en grands ensembles
│           ├── dataIdentifier.test.js ← slugs et pictogrammes d'une liste de données (bien formés, uniques)
│           └── bibleOrder.test.js   ← ordre des livres, des chapitres et des versets
│
├── e2e/                             ← tests de bout en bout (Playwright) : l'app complète en local
│   ├── playwright.config.js         ← 2 appareils (Chrome, iPhone/Safari) + démarrage des serveurs
│   └── tests/
│       ├── helpers.js               ← gestes communs : appui long, scroll jusqu'en bas
│       ├── navigation.spec.js       ← passer d'une page à l'autre, ouvrir /bible directement
│       ├── bible.spec.js            ← lire la Bible en continu ; surlignage partagé ; « Lire tout le chapitre »
│       ├── frise.spec.js            ← la frise : zoom, lecture, saut au clic, mode Bible ; panneau sur téléphone
│       ├── timeline.spec.js         ← lire toute l'histoire ; API en panne puis "Réessayer"
│       ├── verse-menu.spec.js       ← surligner, noter, copier (et retrouver après rechargement)
│       └── share.spec.js            ← lien partagé, retour au début, bouton Partager
│
└── client/                          ← site web (React + Vite)
    ├── index.html                   ← la seule page HTML (app "single page")
    ├── vite.config.js               ← proxy /api → localhost:3000 en dev ; préparation des tests (test/setup.js)
    ├── src/
    │   ├── main.jsx                 ← point d'entrée : monte React (et le routeur) dans la page
    │   ├── App.jsx                  ← assemble tout : barre de navigation, pages (routes), menu d'un verset
    │   ├── pages/                   ← une page par adresse (react-router), toujours dans la même SPA
    │   │   ├── HistoryPage.jsx      ← /       : l'histoire du salut (timeline), la frise à gauche
    │   │   └── BiblePage.jsx / .css ← /bible  : la Bible entière, lue en continu
    │   │                              /bible?livre=Gn&chapitre=3 : commence à ce chapitre ; frise en mode Bible
    │   ├── index.css                ← couleurs, police, hauteur de la barre (fixe en haut), « Revenir au début »
    │   ├── api/
    │   │   ├── http.js              ← getJson : lecture d'une réponse, messages d'erreur clairs
    │   │   ├── passages.api.js      ← appels à l'API (timeline, passage par slug)
    │   │   ├── bible.api.js         ← appels à l'API (Bible entière en continu, position d'un chapitre)
    │   │   └── overview.api.js      ← vue d'ensemble de la frise (un arbre par mode, gardé en mémoire)
    │   ├── bible/
    │   │   ├── reference.js         ← références : "Gn 1,3" (verset), "La Genèse 1, 1 – 2, 25" (passage)
    │   │   └── bibleLink.js         ← lien vers un chapitre : /bible?livre=Gn&chapitre=3 (créer / relire)
    │   ├── components/              ← ce qui s'affiche à l'écran
    │   │   ├── NavBar.jsx / .css    ← la barre de navigation entre les pages (toujours visible en haut)
    │   │   ├── Timeline.jsx / .css  ← la liste des passages + scroll infini
    │   │   ├── ListStatus.jsx / .css ← chargement / erreur / fin d'une liste (timeline, Bible)
    │   │   ├── Passage.jsx / .css   ← un passage : titre, référence, « Lire tout le chapitre », Partager, ses versets
    │   │   ├── Chapter.jsx / .css   ← un chapitre de la Bible entière
    │   │   ├── VerseList.jsx / .css ← les versets (appui long, surlignage, notes), pour passages et chapitres
    │   │   ├── StatusButton.jsx     ← bouton qui confirme son action (Copier, Partager)
    │   │   └── VerseMenu.jsx / .css ← le menu d'un verset (surligner, note, copier)
    │   ├── highlights/              ← surlignages
    │   │   ├── highlights.js        ← logique pure (surligner / retirer)
    │   │   ├── highlights.storage.js← sauvegarde dans le navigateur
    │   │   └── useHighlights.js     ← branchement React
    │   ├── notes/                   ← notes personnelles (même découpage)
    │   │   ├── notes.js
    │   │   ├── notes.storage.js
    │   │   └── useNotes.js
    │   ├── copy/                    ← copier un verset
    │   │   ├── copyVerse.js         ← texte copié : « verset » (Gn 1,3)
    │   │   └── clipboard.js         ← presse-papiers (+ secours hors HTTPS)
    │   ├── share/                   ← partager un passage
    │   │   ├── shareLink.js         ← lien direct /?passage=slug (créer / relire)
    │   │   ├── share.js             ← feuille de partage du téléphone, ou copie du lien
    │   │   └── useStartPosition.js  ← démarrer la timeline au passage du lien (adresse lue par le routeur)
    │   ├── frise/                   ← la frise : cascade de blocs à gauche du texte (maquette V7.1)
    │   │   ├── staircase.js         ← le grand escalier en fonction pure (rectangles, sans navigateur)
    │   │   ├── cascadeLayout.js     ← où va chaque bloc (bandes à gauche, escalier, marches), au pixel près
    │   │   ├── cascadeNavigation.js ← où mène un clic (descendre / remonter) et chaque onglet
    │   │   ├── nodePath.js          ← chemins dans l'arbre de la frise (clé, préfixe, nœud au bout)
    │   │   ├── readingSync.js       ← lecture ↔ frise : nœud lu, place du bateau, la frise suit la lecture
    │   │   ├── readingPosition.js   ← où en est la lecture dans la page ; sauter à un passage (avec fondu)
    │   │   ├── useReadingPosition.js ← la position de lecture, mise à jour pendant le défilement
    │   │   ├── Boat.jsx             ← le petit bateau qui descend la cascade
    │   │   ├── useJump.js           ← clic dans la frise : saut direct, ou liste recommencée à ce passage
    │   │   ├── ReadingWithFrise.jsx / .css ← frise à gauche (toute la hauteur), lecture à droite ; < 1100 px : panneau
    │   │   ├── Frise.jsx / .css     ← le composant : onglets, blocs cliquables, glissement, surlignage, écume
    │   │   ├── useOverview.js       ← charge l'arbre d'un mode (vide si l'API échoue)
    │   │   ├── useElementSize.js    ← la taille d'un élément (ResizeObserver)
    │   │   ├── Icon.jsx             ← un pictogramme au trait (SVG, couleur du texte)
    │   │   └── iconDrawings.jsx     ← les dessins des pictogrammes, par nom
    │   ├── hooks/                   ← appui long, chargement au fil du défilement, point de départ, taille d'écran
    │   │   ├── longPress.js         ← règles (durée, "le doigt a bougé")
    │   │   ├── useLongPress.js      ← branchement React
    │   │   ├── useCursorPagination.js ← liste chargée page par page (timeline et Bible)
    │   │   ├── useStartCursor.js    ← où commencer une liste ouverte par un lien (passage, chapitre)
    │   │   └── useMediaQuery.js     ← une règle de taille d'écran est-elle vraie (ex. écran étroit)
    │   └── storage/                 ← outils partagés par surlignages et notes
    │       ├── versionedStorage.js  ← localStorage au format versionné
    │       └── useStoredMap.js      ← hook : charger / sauvegarder
    └── test/                        ← en miroir de src/ (unitaires + composants avec jsdom)
        ├── App.test.jsx             ← routage : chaque adresse affiche sa page (et la frise sur /)
        ├── setup.js                 ← préparation commune à tous les tests (vide le cache de la frise)
        ├── api/                     ← passages.api (données, messages d'erreur), overview.api (cache)
        ├── bible/                   ← reference, bibleLink
        ├── components/              ← Passage, StatusButton, VerseMenu (React Testing Library)
        ├── pages/BiblePage.test.jsx ← la Bible en continu, titres de livres, menu d'un verset, lien, frise
        ├── pages/HistoryPage.test.jsx ← point de départ (lien partagé) et retour au début, sans rechargement
        ├── copy/                    ← copyVerse, clipboard (moderne + secours hors HTTPS)
        ├── frise/                   ← escalier, disposition, navigation, lecture, pictogrammes (vs données), composant
        ├── highlights/              ← highlights, highlights.storage
        ├── hooks/longPress.test.js
        ├── notes/                   ← notes, notes.storage
        ├── share/                   ← share, shareLink
        └── storage/versionedStorage.test.js ← mécanisme commun de sauvegarde
```

## Données et droits

Le texte biblique vient de la traduction liturgique de l'AELF, utilisée avec l'accord de ses responsables.
