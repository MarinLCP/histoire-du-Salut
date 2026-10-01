# L'histoire d'un Salut

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

## Faire évoluer la base (migrations)

Ne jamais modifier une migration déjà appliquée. Pour changer le schéma :

1. Créer le fichier suivant dans `server/db/migrations/`, ex. `002_add_explanations.sql` (3 chiffres, `_`, un nom en minuscules).
2. Y écrire le SQL du changement (`ALTER TABLE ...`, `CREATE TABLE ...`).
3. Lancer `npm run db:migrate` : seules les nouvelles migrations sont appliquées (la table `schema_migrations` retient les autres).

## Mise en ligne (Render)

En production, un seul serveur : Express envoie l'API **et** le site React construit (`client/dist`).

**1. Remplir la base Render depuis son Mac** (une fois, puis à chaque nouvelle migration)

Créer `server/.env.production` (ignoré par Git, ne jamais le commiter) avec l'**External Database URL** de Render,
suivie de `?sslmode=verify-full` :

```
DATABASE_URL=postgresql://...render.com/...?sslmode=verify-full
```

```bash
cd server
npm run db:migrate:prod    # crée les tables sur Render
npm run seed:prod          # remplit la base Render depuis bible.db
```

**2. Créer le Web Service sur Render** (New → Web Service → ce dépôt GitHub)

| Réglage | Valeur |
|---|---|
| Region | la même que la base |
| Root Directory | *(vide)* |
| Build Command | `cd client && npm ci --include=dev && npm run build && cd ../server && npm ci --omit=dev` |
| Start Command | `cd server && npm start` |
| Health Check Path | `/api/health` |
| Variable `DATABASE_URL` | l'**Internal Database URL** de Render (réseau privé, sans SSL) |
| Variable `NODE_ENV` | `production` |

La version de Node est fixée par le fichier `.node-version` (24).
Chaque `git push` sur `main` redéploie le site.

## Arborescence

```
histoire-du-Salut/
├── README.md                        ← ce fichier
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
│   ├── src/
│   │   ├── index.js                 ← démarre le serveur (app.listen)
│   │   ├── app.js                   ← l'app Express : routes + site React construit (prod)
│   │   ├── db.js                    ← connexion à PostgreSQL (pool)
│   │   ├── queries/
│   │   │   └── passages.queries.js  ← tout le SQL des passages
│   │   └── routes/
│   │       ├── health.routes.js     ← GET /api/health (serveur + base)
│   │       ├── passages.routes.js   ← GET /api/passages/:slug
│   │       └── timeline.routes.js   ← GET /api/timeline?after=&limit=
│   └── test/                        ← tests de l'API (supertest), un fichier par route
│       ├── migrations.test.js       ← choix des migrations à appliquer (sans base)
│       ├── health.test.js           ← GET /api/health (base OK / base injoignable)
│       ├── passages.test.js         ← GET /api/passages/:slug
│       └── timeline.test.js         ← GET /api/timeline (dont la fin de la timeline)
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
    │   ├── components/              ← ce qui s'affiche à l'écran
    │   │   ├── Timeline.jsx / .css  ← la liste des passages + scroll infini
    │   │   ├── TimelineStatus.jsx   ← chargement / erreur / fin de l'histoire
    │   │   ├── Passage.jsx / .css   ← un passage, ses versets et leurs notes
    │   │   ├── ShareButton.jsx      ← le bouton "Partager" d'un passage
    │   │   └── VerseMenu.jsx / .css ← le menu d'un verset (surligner, note, copier)
    │   ├── highlights/              ← surlignages
    │   │   ├── highlights.js        ← logique pure
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
        ├── highlights.test.js       ← logique pure (unitaires)
        ├── highlights.storage.test.js
        ├── notes.test.js
        ├── notes.storage.test.js
        ├── longPress.test.js
        ├── copyVerse.test.js
        ├── shareLink.test.js
        ├── share.test.js
        ├── Passage.test.jsx         ← composants (React Testing Library + jsdom)
        └── VerseMenu.test.jsx
```

## Données et droits

Le texte biblique vient de la traduction liturgique de l'AELF, utilisée avec l'accord de ses responsables.
