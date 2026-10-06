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
npm run seed:prod          # remplit la base Render (seulement les données « validé »)
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
│   │   ├── bible.db                 ← source des textes (SQLite, AELF), lue par le seed
│   │   └── cross-references.zip     ← les parallèles (OpenBible.info, CC-BY), lus directement dans le ZIP
│   ├── db/
│   │   ├── migrations/              ← l'historique du schéma, appliqué dans l'ordre
│   │   │   ├── 001_initial_schema.sql ← tables books, verses, passages
│   │   │   ├── 002_chapters.sql     ← les chapitres dans l'ordre de lecture (Bible entière en continu)
│   │   │   ├── 003_epochs_and_verse_links.sql ← époques, pictogrammes, passages reliés à leurs versets (expand)
│   │   │   ├── 004_bible_groups.sql ← les grands ensembles de la Bible, et celui de chaque livre (expand)
│   │   │   ├── 005_contract_passages.sql ← fin du changement : passages = versets de début et de fin (contract)
│   │   │   ├── 006_sections.sql     ← les sous-chapitres (intertitres posés sur un verset)
│   │   │   ├── 007_characters.sql   ← les personnages et leurs apparitions dans les épisodes
│   │   │   ├── 008_parallels.sql    ← les parallèles : verset → verset ou plage, votes
│   │   │   ├── 009_drop_parallels_index.sql ← retire un index en double (la clé primaire suffit)
│   │   │   ├── 010_accounts.sql     ← comptes (e-mail, mot de passe haché) et sessions (empreinte du jeton)
│   │   │   ├── 011_library.sql      ← notes privées, surlignages, marque-pages d'un compte (par référence "Gn 1,3")
│   │   │   └── 012_sharing.sql      ← pseudo d'un lecteur, et son lien de partage de progression
│   │   ├── bible-groups.data.js     ← les 8 grands ensembles (Pentateuque... Apocalypse) : premier et dernier livre
│   │   ├── epochs.data.js           ← les 10 époques de l'histoire du salut (slug, titre, pictogramme)
│   │   ├── sections.data.js         ← les sous-chapitres (proposés par Claude, statut « proposé » / « validé »)
│   │   ├── characters.data.js       ← les personnages (proposés par Claude) : noms cherchés, livres, exclusions
│   │   └── passages.data.js         ← les 32 passages (slug, références, époque, pictogramme) : à modifier ici
│   ├── scripts/
│   │   ├── migrate.js               ← npm run db:migrate : applique les nouvelles migrations
│   │   ├── migrations.js            ← règle : quelles migrations restent à appliquer
│   │   ├── passageRules.js          ← règles d'un passage (slug, livre, bornes, pictogramme) : le seed s'arrête avant la base
│   │   ├── epochRules.js            ← règles des époques (chaque époque a ses épisodes, à la suite, dans l'ordre)
│   │   ├── bibleGroupRules.js       ← grands ensembles : à la suite, sans trou ni chevauchement, tous les livres
│   │   ├── dataIdentifier.js        ← listes des fichiers de données : slugs et pictogrammes bien formés, uniques
│   │   ├── dataStatus.js            ← statut « proposé » / « validé » : en ligne, seulement le validé
│   │   ├── sectionRules.js          ← règles des sous-chapitres (verset de début qui existe, titre, pas de doublon)
│   │   ├── characterRules.js        ← règles des personnages, et calcul de leurs apparitions (recherche des noms)
│   │   ├── bibleSource.js           ← lit data/bible.db (livres et versets, dans l'ordre de la source)
│   │   ├── verseIndex.js            ← retrouver un verset de la source ; le texte de chaque passage
│   │   ├── bibleOrder.js            ← ordre des livres (Psaumes après Job), des chapitres et des versets
│   │   ├── database.js              ← connexion des scripts (seed, migrations) ; transaction : src/infrastructure
│   │   ├── sqlRows.js               ← petites règles d'écriture du seed ($1, $2... ; verset sans numéro)
│   │   ├── parallels/               ← les parallèles : du fichier OpenBible.info aux versets de l'AELF
│   │   │   ├── parallelsFile.js     ← lit les liens de data/cross-references.zip (seed et rapport)
│   │   │   ├── zipFile.js           ← lit le fichier contenu dans le ZIP (sans dépendance)
│   │   │   ├── crossReferences.js   ← lit les lignes : verset → verset ou plage, votes (garde les votes ≥ 1)
│   │   │   ├── versification.js     ← convertit une référence : codes anglais → AELF, décalages de chapitres
│   │   │   ├── psalms.js            ← les Psaumes : numérotation grecque (9A, 9B...) et titres comptés
│   │   │   └── parallelRules.js     ← chaque lien converti doit tomber sur un verset AELF ; doublons fusionnés
│   │   ├── parallelsReport.js       ← npm run parallels:report : correspondance des parallèles (doit être à 100 %)
│   │   └── seed.js                  ← npm run seed : bible.db + fichiers de données (db/*.data.js) + parallèles → PostgreSQL
│   ├── src/                         ← Clean Architecture : les dépendances pointent vers domain/
│   │   ├── index.js                 ← démarre le serveur (app.listen)
│   │   ├── app.js                   ← assemblage : branche PostgreSQL → use cases → Express
│   │   ├── domain/                  ← règles métier pures (ni Express, ni PostgreSQL)
│   │   │   ├── identifier.js        ← règle commune des identifiants (slugs, pictogrammes)
│   │   │   ├── PassageSlug.js       ← value object : slug bien formé (API et seed)
│   │   │   ├── PageRequest.js       ← value object : page de timeline valide (after, limit ≤ 20)
│   │   │   ├── VerseReference.js    ← value object : la référence d'un verset (Gn 32,2), API et seed
│   │   │   ├── Email.js             ← value object : adresse e-mail d'un compte (minuscules, bien formée)
│   │   │   ├── Password.js          ← value object : mot de passe acceptable (10 à 128 caractères), jamais affiché
│   │   │   ├── DisplayName.js       ← value object : pseudo affiché sur un lien de partage (2 à 30 caractères)
│   │   │   ├── overviewNode.js      ← un nœud de la frise (même forme à tous les niveaux, avec son kind)
│   │   │   ├── historyOverview.js   ← arbre Histoire : époques → épisodes → chapitres couverts → sous-chapitres
│   │   │   ├── bibleOverview.js     ← arbre Bible : ensembles → livres → dizaines (> 15 chapitres) → chapitres → sous-chapitres
│   │   │   ├── PassageRepository.js ← port : contrat de lecture des passages (JSDoc)
│   │   │   ├── BibleRepository.js   ← port : contrat de lecture de la Bible entière (livres, chapitres)
│   │   │   ├── ParallelRepository.js ← port : contrat de lecture des parallèles d'un verset
│   │   │   ├── AccountRepository.js ← ports des comptes : UserRepository, SessionRepository, PasswordHasher
│   │   │   ├── library.js           ← règles de la bibliothèque d'un lecteur (note, lecture, position, envoi groupé)
│   │   │   ├── LibraryRepository.js ← port : notes, surlignages, marque-pages d'un compte
│   │   │   ├── SharingRepository.js ← port : pseudo, lien de partage, progression derrière un lien
│   │   │   └── errors.js            ← ValidationError, UnauthorizedError, NotFoundError, ConflictError
│   │   ├── application/             ← use cases : orchestrent le domaine (repository injecté)
│   │   │   ├── getPassage.js
│   │   │   ├── getTimeline.js
│   │   │   ├── readBible.js         ← la Bible en continu, chapitre après chapitre
│   │   │   ├── findChapter.js       ← position d'un chapitre (ouvrir la Bible au bon endroit)
│   │   │   ├── getHistoryOverview.js ← vue d'ensemble de la frise, mode Histoire du salut
│   │   │   ├── getBibleOverview.js  ← vue d'ensemble de la frise, mode Bible entière
│   │   │   ├── getParallels.js      ← les parallèles d'un verset, les plus votés d'abord (10, puis la suite)
│   │   │   ├── sessions.js          ← durée d'une session (30 jours) ; qui est connecté ; « il faut être connecté »
│   │   │   ├── createAccount.js     ← créer un compte (connecté dans la foulée)
│   │   │   ├── logIn.js             ← se connecter (même message si e-mail inconnu ou mot de passe faux)
│   │   │   ├── logOut.js            ← se déconnecter (la session est fermée)
│   │   │   ├── getCurrentUser.js    ← qui est connecté
│   │   │   ├── deleteAccount.js     ← supprimer son compte (mot de passe retapé)
│   │   │   ├── library.js           ← la bibliothèque du lecteur connecté : lire, fusionner, écrire, retirer
│   │   │   └── sharing.js           ← partager où j'en suis : pseudo, ouvrir / fermer le lien, progression
│   │   ├── infrastructure/          ← le seul endroit qui connaît PostgreSQL
│   │   │   ├── db.js                ← connexion (pool) + pingDatabase
│   │   │   ├── transaction.js       ← inTransaction : tout ou rien (API et scripts)
│   │   │   ├── postgresPassageRepository.js ← tout le SQL des passages
│   │   │   ├── postgresBibleRepository.js   ← tout le SQL de la Bible entière
│   │   │   ├── postgresParallelRepository.js ← le SQL des parallèles (rang par votes, aperçu de 5 versets)
│   │   │   ├── postgresAccountRepository.js  ← le SQL des comptes et des sessions (jeton aléatoire, empreinte SHA-256)
│   │   │   ├── scryptPasswordHasher.js ← hachage des mots de passe (scrypt, inclus dans Node, sel aléatoire)
│   │   │   ├── postgresLibraryRepository.js ← le SQL de la bibliothèque (fusion : la note la plus récente gagne)
│   │   │   ├── postgresSharingRepository.js ← le SQL du partage (marque-page → épisode et chapitre en cours)
│   │   │   ├── verseColumns.js      ← les colonnes d'un verset (et son intertitre), partagées par les repositories
│   │   │   └── rowsByOwner.js       ← range des lignes SQL par passage ou chapitre (une requête pour plusieurs)
│   │   └── http/                    ← le seul endroit qui connaît Express
│   │       ├── createApp.js         ← routes /api/health, /api/passages/:slug, /api/timeline, /api/bible,
│   │       │                          /api/books/:code/chapters/:chapter, /api/overview/history, /api/overview/bible,
│   │       │                          /api/books/:code/chapters/:chapter/verses/:verse/parallels
│   │       │                          + site React construit (prod) + SPA fallback (/bible → index.html)
│   │       ├── privateApi.js        ← adresses propres au lecteur : jamais en cache, corps JSON limité (posé une fois)
│   │       ├── accountRoutes.js     ← /api/account (créer, supprimer), /api/session (se connecter, se déconnecter, qui)
│   │       ├── libraryRoutes.js     ← /api/me/library, /api/me/notes/:verset, /api/me/highlights/:verset, /api/me/bookmarks/:lecture
│   │       ├── sharingRoutes.js     ← /api/me/profile, /api/me/sharing (lecteur connecté), /api/progress/:jeton (public)
│   │       ├── sessionCookie.js     ← le cookie de session (httpOnly, Secure en ligne, SameSite=Lax)
│   │       ├── attemptLimiter.js    ← 10 essais de mot de passe ratés en 15 min pour un e-mail : on attend
│   │       └── errorHandler.js      ← erreurs métier → 400 / 401 / 404 / 409
│   └── test/                        ← en miroir de src/ et scripts/
│       ├── domain/                  ← identifier, PassageSlug, PageRequest, VerseReference, Email, Password, arbres de la frise
│       ├── application/             ← getPassage, getTimeline, readBible, findChapter, vues d'ensemble, parallèles, comptes (faux repository)
│       ├── infrastructure/          ← hachage scrypt
│       ├── http/                    ← l'API de bout en bout (supertest + base de dev)
│       │   ├── health.test.js       ← GET /api/health (base OK / base injoignable)
│       │   ├── passages.test.js     ← GET /api/passages/:slug (indépendant du contenu)
│       │   ├── spaFallback.test.js  ← les adresses du site renvoient index.html, pas l'API
│       │   ├── bible.test.js        ← GET /api/bible (74 livres, sans trou ni doublon), position d'un chapitre
│       │   ├── overview.test.js     ← GET /api/overview/history et /bible (comparés aux fichiers de données)
│       │   ├── parallels.test.js    ← GET .../verses/:verse/parallels (ordre des votes, « Voir plus », aperçu, 404)
│       │   ├── accounts.test.js     ← comptes : créer, cookie, se (dé)connecter, 401/409/429, supprimer
│       │   ├── library.test.js      ← notes, surlignages, marque-pages du compte ; fusion ; chacun ne voit que les siens
│       │   ├── sharing.test.js      ← pseudo, lien de partage (sans e-mail ni notes), arrêter de partager
│       │   ├── attemptLimiter.test.js ← limite d'essais (horloge remplacée)
│       │   └── timeline.test.js     ← GET /api/timeline (dont la fin de la timeline)
│       ├── db/
│       │   └── seededData.test.js   ← ce que le seed a écrit (époques, versets, grands ensembles, parallèles...)
│       └── scripts/
│           ├── migrations.test.js   ← choix des migrations à appliquer
│           ├── database.test.js     ← COMMIT / ROLLBACK, connexion toujours fermée (faux client)
│           ├── sqlRows.test.js      ← numérotation des paramètres, verset sans numéro
│           ├── passageRules.test.js ← règles de passages.data.js (vérifiées avant le seed)
│           ├── epochRules.test.js   ← règles de epochs.data.js et de leur lien avec les passages
│           ├── sectionRules.test.js ← règles des sous-chapitres
│           ├── characterRules.test.js ← règles des personnages, apparitions (mot entier, livres, exclusions)
│           ├── dataStatus.test.js   ← seules les données validées partent en ligne
│           ├── verseIndex.test.js   ← index des versets de la source
│           ├── parallels/           ← lecture du ZIP et des lignes, conversion vérifiée règle par règle
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
│       ├── frise.spec.js            ← la frise : zoom, lecture, saut, sous-chapitres, marque-page, mode Bible ; téléphone
│       ├── characters.spec.js       ← les personnages d'un épisode
│       ├── accounts.spec.js         ← créer un compte, rester connecté, se (dé)connecter, supprimer le compte
│       ├── sharing.spec.js          ← partager où j'en suis ; le lien ouvert sans compte ; arrêter de partager
│       ├── settings.spec.js         ← Paramètres : texte, thème (retenus) ; sauvegarde téléchargée puis réimportée
│       ├── timeline.spec.js         ← lire toute l'histoire ; API en panne puis "Réessayer"
│       ├── verse-menu.spec.js       ← surligner, copier ; une note demande un compte (créé sur place), retrouvée
│       ├── parallels.spec.js        ← les parallèles d'un verset (Bible entière seulement), « Voir plus », aller au verset
│       └── share.spec.js            ← lien partagé, retour au début, bouton Partager
│
└── client/                          ← site web (React + Vite)
    ├── index.html                   ← la seule page HTML (app "single page")
    ├── vite.config.js               ← proxy /api → localhost:3000 en dev ; préparation des tests (test/setup.js)
    ├── src/
    │   ├── main.jsx                 ← point d'entrée : monte React (et le routeur) dans la page
    │   ├── App.jsx                  ← assemble tout : barre de navigation, pages (routes), menu d'un verset, panneaux
    │   ├── pages/                   ← une page par adresse (react-router), toujours dans la même SPA
    │   │   ├── HistoryPage.jsx      ← /       : l'histoire du salut (timeline), la frise à gauche
    │   │   ├── ProgressPage.jsx / .css ← /progression/:jeton : où en est un lecteur (lien qu'il a partagé)
    │   │   └── BiblePage.jsx / .css ← /bible  : la Bible entière, lue en continu
    │   │                              /bible?livre=Gn&chapitre=3 : commence à ce chapitre ; frise en mode Bible
    │   │                              /bible?livre=Gn&chapitre=3&verset=15 : puis défile jusqu'au verset
    │   ├── index.css                ← couleurs, polices, hauteur de la barre (fixe en haut), « Revenir au début »
    │   ├── api/
    │   │   ├── http.js              ← getJson / sendJson : lecture d'une réponse, messages d'erreur clairs
    │   │   ├── account.api.js       ← appels à l'API des comptes (le cookie de session voyage tout seul)
    │   │   ├── library.api.js       ← appels à l'API de la bibliothèque du lecteur connecté
    │   │   ├── sharing.api.js       ← appels à l'API du partage de progression
    │   │   ├── passages.api.js      ← appels à l'API (timeline, passage par slug)
    │   │   ├── bible.api.js         ← appels à l'API (Bible entière en continu, position d'un chapitre, parallèles)
    │   │   └── overview.api.js      ← vue d'ensemble de la frise (un arbre par mode, gardé en mémoire)
    │   ├── bible/
    │   │   ├── reference.js         ← références : "Gn 1,3" (verset), "Mc 9,11-13" (plage),
    │   │   │                          "La Genèse 1, 1 – 2, 25" (passage)
    │   │   ├── bibleLink.js         ← lien vers un chapitre ou un verset : /bible?livre=Gn&chapitre=3&verset=15
    │   │   └── useScrollToVerse.js  ← arrivé par un lien vers un verset : défiler jusqu'à lui, le faire briller
    │   ├── components/              ← ce qui s'affiche à l'écran
    │   │   ├── NavBar.jsx / .css    ← la barre du haut : les deux lectures, et le bouton Paramètres
    │   │   ├── Timeline.jsx / .css  ← la liste des passages + scroll infini
    │   │   ├── ListStatus.jsx / .css ← chargement / erreur / fin d'une liste (timeline, Bible)
    │   │   ├── Passage.jsx / .css   ← un passage : titre, référence, personnages, « Lire tout le chapitre », Partager, versets
    │   │   ├── Chapter.jsx / .css   ← un chapitre de la Bible entière
    │   │   ├── VerseList.jsx / .css ← les versets (appui long, surlignage, notes, intertitres), passages et chapitres
    │   │   ├── StatusButton.jsx     ← bouton qui confirme son action (Copier, Partager)
    │   │   ├── SidePanel.jsx / .css ← un panneau qui glisse depuis la droite (Paramètres, parallèles)
    │   │   └── VerseMenu.jsx / .css ← le menu d'un verset (surligner, note, copier, voir les parallèles) ;
    │   │                              sans compte, « Enregistrer » propose d'en créer un
    │   ├── library/                 ← la bibliothèque du lecteur : compte si connecté, sinon navigateur
    │   │   ├── useLibrary.js        ← notes (compte obligatoire), surlignages, marque-pages ; fusion à la connexion
    │   │   └── BookmarksContext.js  ← le marque-page de chaque lecture, partagé avec la frise
    │   ├── highlights/              ← surlignages
    │   │   ├── highlights.js        ← logique pure (surligner / retirer)
    │   │   └── highlights.storage.js← sauvegarde dans le navigateur
    │   ├── notes/                   ← notes personnelles (même découpage)
    │   │   ├── notes.js
    │   │   └── notes.storage.js
    │   ├── copy/                    ← copier un verset
    │   │   ├── copyVerse.js         ← texte copié : « verset » (Gn 1,3)
    │   │   └── clipboard.js         ← presse-papiers (+ secours hors HTTPS)
    │   ├── share/                   ← partager un passage, ou où on en est
    │   │   ├── shareLink.js         ← lien direct /?passage=slug (créer / relire), lien /progression/:jeton
    │   │   ├── share.js             ← feuille de partage du téléphone, ou copie du lien (shareUrl, sharePassage)
    │   │   └── useStartPosition.js  ← démarrer la timeline au passage du lien (adresse lue par le routeur)
    │   ├── frise/                   ← la frise : cascade de blocs à gauche du texte (maquette V7.1)
    │   │   ├── staircase.js         ← le grand escalier en fonction pure (rectangles, sans navigateur)
    │   │   ├── cascadeLayout.js     ← où va chaque bloc (bandes à gauche, escalier, marches), au pixel près
    │   │   ├── cascadeNavigation.js ← où mène un clic (descendre / remonter) et chaque onglet
    │   │   ├── nodePath.js          ← chemins dans l'arbre de la frise (clé, préfixe, nœud au bout)
    │   │   ├── cascadeView.js       ← état de la frise : niveau affiché, glissement, suivi de la lecture
    │   │   ├── readingSync.js       ← lecture ↔ frise : nœud lu, place du bateau, la frise suit la lecture
    │   │   ├── readingPosition.js   ← où en est la lecture dans la page ; sauter à un passage (avec fondu)
    │   │   ├── useReadingPosition.js ← la position de lecture, mise à jour pendant le défilement
    │   │   ├── Boat.jsx             ← le petit bateau qui descend la cascade
    │   │   ├── BookmarkRibbon.jsx   ← le ruban du marque-page (où on s'était arrêté ; clic = y retourner)
    │   │   ├── useBookmark.js       ← le marque-page : retenu pendant la lecture, montré à la visite suivante
    │   │   ├── bookmark.storage.js  ← sauvegarde du marque-page dans le navigateur (une position par lecture)
    │   │   ├── useJump.js           ← clic dans la frise : saut direct, ou liste recommencée à ce passage
    │   │   ├── ReadingWithFrise.jsx / .css ← frise à gauche ; < 1100 px : panneau (2/3 de l'écran), onglet « Frise »
    │   │   ├── Frise.jsx / .css     ← le composant : onglets, blocs cliquables, glissement, surlignage, écume
    │   │   ├── useOverview.js       ← charge l'arbre d'un mode (vide si l'API échoue)
    │   │   ├── useElementSize.js    ← la taille d'un élément (ResizeObserver)
    │   │   ├── Icon.jsx             ← un pictogramme au trait (SVG, couleur du texte)
    │   │   └── iconDrawings.jsx     ← les dessins des pictogrammes, par nom
    │   ├── parallels/               ← les parallèles d'un verset (Bible entière seulement, OpenBible.info)
    │   │   ├── useParallels.js      ← chargés 10 par 10, les plus votés d'abord (« Voir plus »)
    │   │   └── ParallelsPanel.jsx / .css ← le panneau : référence et début du texte, clic = aller au verset
    │   ├── backup/                  ← sauvegarde des notes et surlignages (dans le panneau Paramètres)
    │   │   ├── backup.js            ← règles : créer, relire, fusionner une sauvegarde (fichier JSON)
    │   │   ├── downloadJson.js      ← faire télécharger un fichier JSON
    │   │   └── BackupSection.jsx    ← « Télécharger une sauvegarde » / « Importer une sauvegarde »
    │   ├── account/                 ← le compte du lecteur (section « Mon compte » des Paramètres)
    │   │   ├── useAccount.js        ← qui est connecté ; créer, se connecter, se déconnecter, supprimer
    │   │   ├── SignInForm.jsx / .css ← formulaire « Se connecter » / « Créer un compte » (Paramètres, menu d'un verset)
    │   │   ├── AccountSection.jsx / .css ← la section : formulaire, ou e-mail + Se déconnecter + Supprimer
    │   │   ├── useSharing.js        ← le pseudo et le lien de partage du lecteur connecté
    │   │   └── SharingSection.jsx   ← « Partager où j'en suis » : pseudo, partager, arrêter de partager
    │   ├── settings/                ← les Paramètres (bouton de la barre du haut, panneau à droite)
    │   │   ├── settings.js          ← règles : taille du texte, thème (et leur application à la page)
    │   │   ├── settings.storage.js  ← sauvegarde des réglages dans le navigateur
    │   │   ├── useSettings.js       ← branchement React (appliqués et sauvegardés à chaque changement)
    │   │   └── SettingsPanel.jsx / .css ← le panneau (dans un SidePanel)
    │   ├── hooks/                   ← appui long, chargement au fil du défilement, point de départ, taille d'écran
    │   │   ├── longPress.js         ← règles (durée, "le doigt a bougé")
    │   │   ├── useLongPress.js      ← branchement React
    │   │   ├── useCursorPages.js    ← liste chargée page par page (réponses en double ou périmées ignorées)
    │   │   ├── useCursorPagination.js ← la même, au fil du défilement (timeline et Bible)
    │   │   ├── useStartCursor.js    ← où commencer une liste ouverte par un lien (passage, chapitre)
    │   │   ├── useLoaded.js         ← une valeur chargée pour une clé (départ, chargée, ou secours)
    │   │   ├── useModalDialog.js    ← une fenêtre <dialog> modale (menu d'un verset, Paramètres)
    │   │   └── useMediaQuery.js     ← une règle de taille d'écran est-elle vraie (ex. écran étroit)
    │   └── storage/                 ← outils partagés par surlignages et notes (dans le navigateur)
    │       ├── versionedStorage.js  ← localStorage au format versionné
    │       └── useStoredMap.js      ← hook : charger / sauvegarder
    └── test/                        ← en miroir de src/ (unitaires + composants avec jsdom)
        ├── App.test.jsx             ← routage, frise sur /, panneau Paramètres, panneau des parallèles
        ├── setup.js                 ← préparation commune à tous les tests (vide le cache et le stockage)
        ├── helpers/                 ← outils des tests (faux ResizeObserver)
        ├── api/                     ← passages.api (données, messages d'erreur), overview.api (cache)
        ├── bible/                   ← reference, bibleLink
        ├── components/              ← Passage, StatusButton, VerseMenu (React Testing Library)
        ├── pages/BiblePage.test.jsx ← la Bible en continu, titres de livres, menu d'un verset, liens (chapitre, verset), frise
        ├── pages/ProgressPage.test.jsx ← où en est un lecteur ; pas commencé ; lien inconnu
        ├── pages/HistoryPage.test.jsx ← point de départ (lien partagé) et retour au début, sans rechargement
        ├── copy/                    ← copyVerse, clipboard (moderne + secours hors HTTPS)
        ├── frise/                   ← escalier, disposition, navigation, lecture, pictogrammes (vs données), composant
        ├── highlights/              ← highlights, highlights.storage
        ├── hooks/                   ← longPress, useLoaded
        ├── account/                 ← section « Mon compte », useAccount, « Partager où j'en suis »
        ├── library/                 ← useLibrary (sans compte, fusion à la connexion, écriture annulée si échec)
        ├── settings/                ← règles des réglages, panneau
        ├── parallels/               ← panneau des parallèles (ordre, « Voir plus », lien, source)
        ├── backup/                  ← règles de la sauvegarde, section du panneau
        ├── notes/                   ← notes, notes.storage
        ├── share/                   ← share, shareLink
        └── storage/versionedStorage.test.js ← mécanisme commun de sauvegarde
```

## Données et droits

Le texte biblique vient de la traduction liturgique de l'AELF, utilisée avec l'accord de ses responsables.

Les parallèles entre versets viennent d'[OpenBible.info](https://www.openbible.info/labs/cross-references/)
(licence CC-BY) : leur numérotation (celle des Bibles protestantes) est convertie vers celle de l'AELF par
`server/scripts/parallels/` ; `npm run parallels:report` (dans server/) vérifie que chaque lien tombe sur un
verset AELF. La source est citée dans l'app, en bas du panneau des parallèles.
