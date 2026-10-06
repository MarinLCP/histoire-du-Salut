// Remplit toute la base (npm run seed ; en ligne : npm run seed:prod) :
// - la Bible : books, verses et chapters depuis data/bible.db (SQLite, AELF), dans l'ordre d'une Bible
//   catholique (Psaumes après Job : voir bibleOrder.js), et bible_groups (db/bible-groups.data.js) ;
// - l'histoire du salut : epochs et passages (db/epochs.data.js, db/passages.data.js) ;
// - les sous-chapitres (db/sections.data.js) et les personnages (db/characters.data.js), dont les apparitions
//   dans les épisodes sont calculées ici, en cherchant leurs noms dans le texte ;
// - les parallèles (data/cross-references.zip, OpenBible.info), convertis en références AELF : le seed
//   s'arrête si un seul ne correspond à aucun verset (détail : npm run parallels:report).
// Les fichiers de données sont vérifiés AVANT de toucher à la base. Les données proposées par Claude
// (status 'proposé') ne sont écrites qu'en local et dans la CI : en ligne (option --production), seules
// les données validées par Marin le sont.
// Rejouable : on vide les tables avant de les remplir, dans une transaction (tout ou rien).

import { bibleGroups } from '../db/bible-groups.data.js';
import { epochs } from '../db/epochs.data.js';
import { passages } from '../db/passages.data.js';
import { sections } from '../db/sections.data.js';
import { characters } from '../db/characters.data.js';
import { validatePassages } from './passageRules.js';
import { validateEpochs } from './epochRules.js';
import { assignBookGroups } from './bibleGroupRules.js';
import { validateSections } from './sectionRules.js';
import { validateCharacters, characterAppearances } from './characterRules.js';
import { passageTexts } from './verseIndex.js';
import { publishable } from './dataStatus.js';
import { canonicalBookOrder, chaptersInReadingOrder, versesInReadingOrder } from './bibleOrder.js';
import { withClient, inTransaction } from './database.js';
import { readBibleSource } from './bibleSource.js';
import { readParallelLinks } from './parallels/parallelsFile.js';
import { matchParallels, requireFullMatch } from './parallels/parallelRules.js';
import { VerseReference } from '../src/domain/VerseReference.js';
import { placeholdersFor, verseKind } from './sqlRows.js';

const BATCH_SIZE = 1000;
// Les parallèles sont 341 000 : des lots plus gros, moins d'allers-retours avec la base en ligne
// (5000 lignes × 4 colonnes = 20 000 paramètres, sous la limite de PostgreSQL : 65 535)
const PARALLEL_BATCH_SIZE = 5000;
// En ligne, seulement ce que Marin a validé (voir dataStatus.js)
const withProposals = !process.argv.includes('--production');

const source = readBibleSource();
const books = canonicalBookOrder(source.books);
const chapters = chaptersInReadingOrder(books, source.verses);
const verses = versesInReadingOrder(books, source.verses);
// Une faute dans un fichier de données arrête le seed ICI, avant de toucher à la base
validatePassages(passages, source.verses);
validateEpochs(epochs, passages);
validateSections(sections, source.verses);
const sectionsToWrite = publishable(sections, { withProposals });
validateCharacters(characters, { passageSlugs: passages.map((passage) => passage.slug), bookCodes: books.map((book) => book.code) });
const charactersToWrite = publishable(characters, { withProposals });
const appearances = characterAppearances(charactersToWrite, passageTexts(passages, source.verses));
const groupOfBook = assignBookGroups(bibleGroups, books.map((book) => book.code));
// Vérifiés dans l'ordre de lecture du site (celui de la base) : une plage doit aller dans cet ordre
const { parallels, unmatched } = matchParallels(readParallelLinks(), verses);
requireFullMatch(unmatched);

// Soit tout est écrit, soit rien (une erreur au milieu annule tout)
await withClient((client) => inTransaction(client, async () => {
  await clearTables(client);
  const groupIds = await insertSlugList(client, 'bible_groups', bibleGroups);
  const bookIds = await insertBooks(client, books, groupOfBook, groupIds);
  await insertVerses(client, verses, bookIds);
  await insertChapters(client, chapters, bookIds);
  const epochIds = await insertSlugList(client, 'epochs', epochs);
  const passageIds = await insertPassages(client, passages, bookIds, epochIds);
  await insertSections(client, sectionsToWrite, bookIds);
  const characterIds = await insertCharacters(client, charactersToWrite);
  await insertAppearances(client, appearances, passageIds, characterIds);
  await insertParallels(client, parallels);
}));

console.log(
  `Seed terminé : ${bibleGroups.length} ensembles, ${books.length} livres, ${chapters.length} chapitres, `
  + `${source.verses.length} versets, ${epochs.length} époques, ${passages.length} passages, `
  + `${sectionsToWrite.length} sous-chapitres, ${charactersToWrite.length} personnages (${appearances.length} apparitions), `
  + `${parallels.length} parallèles`
  + `${withProposals ? ', propositions comprises.' : ', validés seulement.'}`,
);

// --- Écriture dans PostgreSQL ---

// Pas de CASCADE : si une autre table pointe un jour vers ces tables
// (ex. des surlignages), Postgres refusera au lieu d'effacer ces données.
async function clearTables(client) {
  await client.query(
    'TRUNCATE parallels, passage_characters, characters, sections, passages, epochs, chapters, verses, books, bible_groups RESTART IDENTITY',
  );
}

// Insère une liste des fichiers de données (slug, titre, pictogramme), dans l'ordre, une ligne à la fois
// (une dizaine au plus), et renvoie une Map : slug -> id. Sert aux grands ensembles et aux époques.
// table : 'bible_groups' ou 'epochs', écrit dans ce fichier (jamais une donnée venue de l'extérieur).
async function insertSlugList(client, table, items) {
  const ids = new Map();

  for (const [index, item] of items.entries()) {
    const result = await client.query(
      `INSERT INTO ${table} (slug, title, icon, position) VALUES ($1, $2, $3, $4) RETURNING id`,
      [item.slug, item.title, item.icon, index + 1],
    );
    ids.set(item.slug, result.rows[0].id);
  }

  return ids;
}

// Insère les livres (seulement 74, un par un) et renvoie une Map : code du livre -> id.
// groupOfBook : code du livre -> slug de son ensemble ; groupIds : slug de l'ensemble -> id
async function insertBooks(client, books, groupOfBook, groupIds) {
  const bookIds = new Map();

  for (const [index, book] of books.entries()) {
    const result = await client.query(
      'INSERT INTO books (code, title, position, group_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [book.code, book.title, index + 1, groupIds.get(groupOfBook.get(book.code))],
    );
    bookIds.set(book.code, result.rows[0].id);
  }

  return bookIds;
}

// Insère les versets par lots (position = 1, 2, 3... dans l'ordre de lecture)
async function insertVerses(client, verses, bookIds) {
  const rows = verses.map((verse, index) => [
    bookIds.get(verse.code), verse.chapter, verse.verse, verseKind(verse), verse.text, index + 1,
  ]);
  await insertInBatches(client, 'verses (book_id, chapter, verse, kind, text, position)', rows, BATCH_SIZE);
}

// Insère des lignes par lots : une requête de 1000 lignes est bien plus rapide que 1000 requêtes d'une ligne.
// target : la table et ses colonnes, écrites dans ce fichier (jamais une donnée venue de l'extérieur).
async function insertInBatches(client, target, rows, batchSize) {
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    await client.query(`INSERT INTO ${target} VALUES ${placeholdersFor(batch)}`, batch.flat());
  }
}

// Les chapitres, dans l'ordre de lecture (position 1, 2, 3...), en une seule requête (1 332 lignes)
async function insertChapters(client, chapters, bookIds) {
  const rows = chapters.map((chapter, index) => [bookIds.get(chapter.code), chapter.label, index + 1]);
  await client.query(`INSERT INTO chapters (book_id, label, position) VALUES ${placeholdersFor(rows)}`, rows.flat());
}

// Insère les passages dans l'ordre de la liste (déjà vérifiés par validatePassages et validateEpochs),
// et renvoie une Map : slug du passage -> id.
// Les id des versets de début et de fin sont retrouvés par la base elle-même (sous-requêtes) :
// $6 = le livre, $7/$8 = chapitre et verset de début, $9/$10 = chapitre et verset de fin.
async function insertPassages(client, passages, bookIds, epochIds) {
  const passageIds = new Map();
  for (const [index, passage] of passages.entries()) {
    const result = await client.query(
      `INSERT INTO passages (position, slug, title, epoch_id, icon, start_verse_id, end_verse_id)
       VALUES ($1, $2, $3, $4, $5,
               (SELECT id FROM verses WHERE book_id = $6 AND chapter = $7 AND verse = $8),
               (SELECT id FROM verses WHERE book_id = $6 AND chapter = $9 AND verse = $10))
       RETURNING id`,
      [index + 1, passage.slug, passage.title, epochIds.get(passage.epoch), passage.icon,
        bookIds.get(passage.book), ...passage.start, ...passage.end],
    );
    passageIds.set(passage.slug, result.rows[0].id);
  }
  return passageIds;
}

// Insère les sous-chapitres (déjà vérifiés par validateSections). L'id du verset de début est retrouvé
// par la base elle-même (sous-requête) : $1 = le livre, $2 / $3 = chapitre et verset.
async function insertSections(client, sections, bookIds) {
  for (const section of sections) {
    await client.query(
      `INSERT INTO sections (start_verse_id, title)
       VALUES ((SELECT id FROM verses WHERE book_id = $1 AND chapter = $2 AND verse = $3), $4)`,
      [bookIds.get(section.book), ...section.start, section.title],
    );
  }
}

// Insère les personnages dans l'ordre de la liste (l'ordre d'affichage) et renvoie une Map : slug -> id
async function insertCharacters(client, characters) {
  const characterIds = new Map();
  for (const [index, character] of characters.entries()) {
    const result = await client.query(
      'INSERT INTO characters (slug, name, position) VALUES ($1, $2, $3) RETURNING id',
      [character.slug, character.name, index + 1],
    );
    characterIds.set(character.slug, result.rows[0].id);
  }
  return characterIds;
}

// Insère les apparitions calculées (characterAppearances), en une seule requête
async function insertAppearances(client, appearances, passageIds, characterIds) {
  if (appearances.length === 0) return;
  const rows = appearances.map((appearance) => [
    passageIds.get(appearance.passage), characterIds.get(appearance.character), appearance.mentions,
  ]);
  await client.query(
    `INSERT INTO passage_characters (passage_id, character_id, mentions) VALUES ${placeholdersFor(rows)}`,
    rows.flat(),
  );
}

// Insère les parallèles (déjà mis en correspondance, à 100 %). L'id de chaque verset est lu une fois
// dans la base (« Gn 32,2 » -> id) : plus rapide que trois sous-requêtes pour chacune des 341 000 lignes.
async function insertParallels(client, parallels) {
  const verseIds = await readVerseIds(client);
  const rows = parallels.map(({ from, toStart, toEnd, votes }) => [
    verseIds.get(String(from)), verseIds.get(String(toStart)), verseIds.get(String(toEnd)), votes,
  ]);
  await insertInBatches(client, 'parallels (from_verse_id, to_start_verse_id, to_end_verse_id, votes)', rows, PARALLEL_BATCH_SIZE);
}

// Map : référence du verset (« Gn 32,2 », le texte d'une VerseReference) -> id. Les lignes sans numéro
// (ex. « ELLE » dans le Cantique) ne sont pas des versets : aucun parallèle n'y mène.
async function readVerseIds(client) {
  const result = await client.query(
    `SELECT verses.id, books.code AS book, verses.chapter, verses.verse
     FROM verses JOIN books ON books.id = verses.book_id
     WHERE verses.verse IS NOT NULL`,
  );
  return new Map(result.rows.map((row) => [String(VerseReference.from(row)), row.id]));
}
