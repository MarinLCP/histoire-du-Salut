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

## Feature flags (cacher une fonctionnalité pas finie)

On commite tous les jours sur `main` (Trunk-Based Development) : une fonctionnalité en cours est cachée en ligne.

- **En dev** (`npm run dev`) : tout est visible.
- **En ligne** : seulement les fonctionnalités listées dans la variable Render **`VITE_FEATURES`** (ex. `frise,graphe`).

Dans un composant : `{hasFeature('frise') && <Frise />}` (voir [client/src/features/features.js](client/src/features/features.js)).
Pour mettre en ligne : ajouter le nom dans `VITE_FEATURES` sur Render (cela redéploie : la valeur est lue au build).
Une fois la fonctionnalité stable, on supprime son flag du code. Jamais de secret dans une variable `VITE_` : elle finit dans le navigateur.

## Faire évoluer la base (migrations)

Ne jamais modifier une migration déjà appliquée. Pour changer le schéma :

1. Créer le fichier suivant dans `server/db/migrations/`, ex. `002_add_explanations.sql` (3 chiffres, `_`, un nom en minuscules).
2. Y écrire le SQL du changement (`ALTER TABLE ...`, `CREATE TABLE ...`).
3. Lancer `npm run db:migrate` : seules les nouvelles migrations sont appliquées (la table `schema_migrations` retient les autres).
4. En ligne, rien à faire : Render lance `npm run db:migrate` à chaque démarrage, avant le serveur.
   Si une migration échoue, le serveur ne démarre pas et Render garde l'ancienne version en ligne.

## Mise en ligne (Render)

En production, un seul serveur : Express envoie l'API **et** le site React construit (`client/dist`).

**1. Remplir la base Render depuis son Mac** (la première fois, puis à chaque changement de `passages.data.js` ou `epochs.data.js`)

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
│   │   │   └── 003_epochs_and_verse_links.sql ← époques, pictogrammes, passages reliés à leurs versets (expand)
│   │   ├── epochs.data.js           ← les 10 époques de l'histoire du salut (slug, titre, pictogramme)
│   │   └── passages.data.js         ← les 32 passages (slug, références, époque, pictogramme) : à modifier ici
│   ├── scripts/
│   │   ├── migrate.js               ← npm run db:migrate : applique les nouvelles migrations
│   │   ├── migrations.js            ← règle : quelles migrations restent à appliquer
│   │   ├── passageRules.js          ← règles d'un passage (slug, livre, bornes, pictogramme) : le seed s'arrête avant la base
│   │   ├── epochRules.js            ← règles des époques (chaque époque a ses épisodes, à la suite, dans l'ordre)
│   │   ├── dataIdentifier.js        ← format des identifiants des fichiers de données (slug d'époque, pictogramme)
│   │   ├── bibleOrder.js            ← ordre des livres (Psaumes après Job) et des chapitres
│   │   └── seed.js                  ← npm run seed : bible.db + epochs.data.js + passages.data.js → PostgreSQL
│   ├── src/                         ← Clean Architecture : les dépendances pointent vers domain/
│   │   ├── index.js                 ← démarre le serveur (app.listen)
│   │   ├── app.js                   ← assemblage : branche PostgreSQL → use cases → Express
│   │   ├── domain/                  ← règles métier pures (ni Express, ni PostgreSQL)
│   │   │   ├── PassageSlug.js       ← value object : slug bien formé (API et seed)
│   │   │   ├── PageRequest.js       ← value object : page de timeline valide (after, limit ≤ 20)
│   │   │   ├── PassageRepository.js ← port : contrat de lecture des passages (JSDoc)
│   │   │   ├── BibleRepository.js   ← port : contrat de lecture de la Bible entière (livres, chapitres)
│   │   │   └── errors.js            ← ValidationError, NotFoundError
│   │   ├── application/             ← use cases : orchestrent le domaine (repository injecté)
│   │   │   ├── getPassage.js
│   │   │   ├── getTimeline.js
│   │   │   ├── listBooks.js         ← les 74 livres
│   │   │   ├── readBible.js         ← la Bible en continu, chapitre après chapitre
│   │   │   └── findChapter.js       ← position d'un chapitre (ouvrir la Bible au bon endroit)
│   │   ├── infrastructure/          ← le seul endroit qui connaît PostgreSQL
│   │   │   ├── db.js                ← connexion (pool) + pingDatabase
│   │   │   ├── postgresPassageRepository.js ← tout le SQL des passages
│   │   │   ├── postgresBibleRepository.js   ← tout le SQL de la Bible entière
│   │   │   └── verseColumns.js      ← les colonnes d'un verset, partagées par les deux repositories
│   │   └── http/                    ← le seul endroit qui connaît Express
│   │       ├── createApp.js         ← routes /api/health, /api/passages/:slug, /api/timeline, /api/books, /api/bible,
│   │       │                          /api/books/:code/chapters/:chapter
│   │       │                          + site React construit (prod) + SPA fallback (/bible → index.html)
│   │       └── errorHandler.js      ← erreurs métier → 400 / 404
│   └── test/                        ← en miroir de src/ et scripts/
│       ├── domain/                  ← PassageSlug, PageRequest (unitaires, sans base)
│       ├── application/             ← getPassage, getTimeline, readBible, findChapter (avec un faux repository)
│       ├── http/                    ← l'API de bout en bout (supertest + base de dev)
│       │   ├── health.test.js       ← GET /api/health (base OK / base injoignable)
│       │   ├── passages.test.js     ← GET /api/passages/:slug (indépendant du contenu)
│       │   ├── spaFallback.test.js  ← les adresses du site renvoient index.html, pas l'API
│       │   ├── bible.test.js        ← GET /api/books, GET /api/bible (sans trou ni doublon), position d'un chapitre
│       │   └── timeline.test.js     ← GET /api/timeline (dont la fin de la timeline)
│       ├── db/
│       │   └── seededData.test.js   ← ce que le seed a écrit (époques, pictogrammes, liens vers les versets)
│       └── scripts/
│           ├── migrations.test.js   ← choix des migrations à appliquer
│           ├── passageRules.test.js ← règles de passages.data.js (vérifiées avant le seed)
│           ├── epochRules.test.js   ← règles de epochs.data.js et de leur lien avec les passages
│           └── bibleOrder.test.js   ← ordre des livres et des chapitres
│
├── e2e/                             ← tests de bout en bout (Playwright) : l'app complète en local
│   ├── playwright.config.js         ← 2 appareils (Chrome, iPhone/Safari) + démarrage des serveurs
│   └── tests/
│       ├── helpers.js               ← gestes communs : appui long, scroll jusqu'en bas
│       ├── navigation.spec.js       ← passer d'une page à l'autre, ouvrir /bible directement
│       ├── bible.spec.js            ← lire la Bible en continu ; surlignage partagé ; « Lire tout le chapitre »
│       ├── timeline.spec.js         ← lire toute l'histoire ; API en panne puis "Réessayer"
│       ├── verse-menu.spec.js       ← surligner, noter, copier (et retrouver après rechargement)
│       └── share.spec.js            ← lien partagé, retour au début, bouton Partager
│
└── client/                          ← site web (React + Vite)
    ├── index.html                   ← la seule page HTML (app "single page")
    ├── vite.config.js               ← proxy /api → localhost:3000 en dev
    ├── src/
    │   ├── main.jsx                 ← point d'entrée : monte React (et le routeur) dans la page
    │   ├── App.jsx                  ← assemble tout : barre de navigation, pages (routes), menu d'un verset
    │   ├── pages/                   ← une page par adresse (react-router), toujours dans la même SPA
    │   │   ├── HistoryPage.jsx      ← /       : l'histoire du salut (timeline)
    │   │   └── BiblePage.jsx / .css ← /bible  : la Bible entière, lue en continu (cachée en ligne : flag "bible")
    │   │                              /bible?livre=Gn&chapitre=3 : commence à ce chapitre
    │   ├── index.css                ← couleurs (clair / sombre), police, lien « Revenir au début »
    │   ├── api/
    │   │   ├── http.js              ← getJson : lecture d'une réponse, messages d'erreur clairs
    │   │   ├── passages.api.js      ← appels à l'API (timeline, passage par slug)
    │   │   └── bible.api.js         ← appels à l'API (Bible entière en continu, position d'un chapitre)
    │   ├── bible/
    │   │   ├── reference.js         ← références : "Gn 1,3" (verset), "La Genèse 1, 1 – 2, 25" (passage)
    │   │   └── bibleLink.js         ← lien vers un chapitre : /bible?livre=Gn&chapitre=3 (créer / relire)
    │   ├── components/              ← ce qui s'affiche à l'écran
    │   │   ├── NavBar.jsx / .css    ← la barre de navigation entre les pages
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
    │   │   └── useStartPosition.js  ← démarrer la timeline au passage du lien
    │   ├── features/
    │   │   └── features.js          ← feature flags : hasFeature('frise')
    │   ├── hooks/                   ← appui long, chargement au fil du défilement
    │   │   ├── longPress.js         ← règles (durée, "le doigt a bougé")
    │   │   ├── useLongPress.js      ← branchement React
    │   │   ├── useCursorPagination.js ← liste chargée page par page (timeline et Bible)
    │   │   └── useStartCursor.js    ← où commencer une liste ouverte par un lien (passage, chapitre)
    │   └── storage/                 ← outils partagés par surlignages et notes
    │       ├── versionedStorage.js  ← localStorage au format versionné
    │       └── useStoredMap.js      ← hook : charger / sauvegarder
    └── test/                        ← en miroir de src/ (unitaires + composants avec jsdom)
        ├── App.test.jsx             ← routage : chaque adresse affiche sa page
        ├── api/passages.api.test.js ← données et messages d'erreur de l'API
        ├── bible/                   ← reference, bibleLink
        ├── components/              ← Passage, StatusButton, VerseMenu (React Testing Library)
        ├── pages/BiblePage.test.jsx ← la Bible en continu, titres de livres, menu d'un verset, ouverte par un lien
        ├── copy/                    ← copyVerse, clipboard (moderne + secours hors HTTPS)
        ├── features/features.test.js
        ├── highlights/              ← highlights, highlights.storage
        ├── hooks/longPress.test.js
        ├── notes/                   ← notes, notes.storage
        ├── share/                   ← share, shareLink
        └── storage/versionedStorage.test.js ← mécanisme commun de sauvegarde
```

## Données et droits

Le texte biblique vient de la traduction liturgique de l'AELF, utilisée avec l'accord de ses responsables.
