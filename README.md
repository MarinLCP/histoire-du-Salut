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
- **client** : lint, tests, build.

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

**1. Remplir la base Render depuis son Mac** (la première fois, puis à chaque changement de `passages.data.js`)

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
├── .github/workflows/ci.yml         ← CI : tests serveur + client à chaque push (GitHub Actions)
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
│   │   │   └── 001_initial_schema.sql ← tables books, verses, passages
│   │   └── passages.data.js         ← les 32 passages (slug + références) : à modifier ici
│   ├── scripts/
│   │   ├── migrate.js               ← npm run db:migrate : applique les nouvelles migrations
│   │   ├── migrations.js            ← règle : quelles migrations restent à appliquer
│   │   └── seed.js                  ← npm run seed : bible.db + passages.data.js → PostgreSQL
│   ├── src/                         ← Clean Architecture : les dépendances pointent vers domain/
│   │   ├── index.js                 ← démarre le serveur (app.listen)
│   │   ├── app.js                   ← assemblage : branche PostgreSQL → use cases → Express
│   │   ├── domain/                  ← règles métier pures (ni Express, ni PostgreSQL)
│   │   │   ├── PassageSlug.js       ← value object : slug bien formé (API et seed)
│   │   │   ├── PageRequest.js       ← value object : page de timeline valide (after, limit ≤ 20)
│   │   │   ├── PassageRepository.js ← port : contrat de lecture des passages (JSDoc)
│   │   │   └── errors.js            ← ValidationError, NotFoundError
│   │   ├── application/             ← use cases : orchestrent le domaine (repository injecté)
│   │   │   ├── getPassage.js
│   │   │   └── getTimeline.js
│   │   ├── infrastructure/          ← le seul endroit qui connaît PostgreSQL
│   │   │   ├── db.js                ← connexion (pool) + pingDatabase
│   │   │   └── postgresPassageRepository.js ← tout le SQL des passages
│   │   └── http/                    ← le seul endroit qui connaît Express
│   │       ├── createApp.js         ← routes /api/health, /api/passages/:slug, /api/timeline
│   │       │                          + site React construit (prod)
│   │       └── errorHandler.js      ← erreurs métier → 400 / 404
│   └── test/                        ← tests de l'API (supertest) + tests unitaires sans base
│       ├── domain/                  ← PassageSlug, PageRequest
│       ├── application/             ← getPassage, getTimeline (avec un faux repository)
│       ├── migrations.test.js       ← choix des migrations à appliquer (sans base)
│       ├── health.test.js           ← GET /api/health (base OK / base injoignable)
│       ├── passages.test.js         ← GET /api/passages/:slug
│       └── timeline.test.js         ← GET /api/timeline (dont la fin de la timeline)
│
├── e2e/                             ← tests de bout en bout (Playwright) : l'app complète en local
│   ├── playwright.config.js         ← 2 appareils (Chrome, iPhone/Safari) + démarrage des serveurs
│   └── tests/
│       ├── helpers.js               ← gestes communs : appui long, scroll jusqu'en bas
│       ├── timeline.spec.js         ← lire toute l'histoire en scrollant
│       ├── verse-menu.spec.js       ← surligner, noter, copier (et retrouver après rechargement)
│       └── share.spec.js            ← lien partagé, retour au début, bouton Partager
│
└── client/                          ← site web (React + Vite)
    ├── index.html                   ← la seule page HTML (app "single page")
    ├── vite.config.js               ← proxy /api → localhost:3000 en dev
    ├── src/
    │   ├── main.jsx                 ← point d'entrée : monte React dans la page
    │   ├── App.jsx                  ← assemble tout : timeline + menu d'un verset
    │   ├── index.css                ← couleurs (clair / sombre), police
    │   ├── api/
    │   │   └── passages.api.js      ← appels à l'API (timeline, passage par slug)
    │   ├── bible/
    │   │   └── reference.js         ← références : "Gn 1,3" (verset), "La Genèse 1, 1 – 2, 25" (passage)
    │   ├── components/              ← ce qui s'affiche à l'écran
    │   │   ├── Timeline.jsx / .css  ← la liste des passages + scroll infini
    │   │   ├── TimelineStatus.jsx   ← chargement / erreur / fin de l'histoire
    │   │   ├── Passage.jsx / .css   ← un passage, ses versets et leurs notes
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
    │   ├── hooks/                   ← appui long
    │   │   ├── longPress.js         ← règles (durée, "le doigt a bougé")
    │   │   └── useLongPress.js      ← branchement React
    │   └── storage/                 ← outils partagés par surlignages et notes
    │       ├── versionedStorage.js  ← localStorage au format versionné
    │       └── useStoredMap.js      ← hook : charger / sauvegarder
    └── test/
        ├── reference.test.js        ← logique pure (unitaires)
        ├── highlights.test.js
        ├── highlights.storage.test.js
        ├── notes.test.js
        ├── notes.storage.test.js
        ├── longPress.test.js
        ├── copyVerse.test.js
        ├── shareLink.test.js
        ├── share.test.js
        ├── Passage.test.jsx         ← composants (React Testing Library + jsdom)
        ├── StatusButton.test.jsx
        └── VerseMenu.test.jsx
```

## Données et droits

Le texte biblique vient de la traduction liturgique de l'AELF, utilisée avec l'accord de ses responsables.
