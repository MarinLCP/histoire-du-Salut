// Règles d'ordre de la Bible, utilisées par le seed (fonctions pures, testées).

// La source (bible.db) range le Livre des Psaumes après l'Apocalypse. Dans une Bible catholique,
// il vient juste après Job : on le remet à sa place. Renvoie une NOUVELLE liste.
export function canonicalBookOrder(books) {
  const psalms = books.find((book) => book.code === 'Ps');
  const job = books.findIndex((book) => book.code === 'Jb');
  if (!psalms || job === -1) return [...books];

  const others = books.filter((book) => book !== psalms);
  const afterJob = others.findIndex((book) => book.code === 'Jb') + 1;
  return [...others.slice(0, afterJob), psalms, ...others.slice(afterJob)];
}

// Les chapitres dans l'ordre de lecture : les livres dans l'ordre donné, et dans chaque livre,
// les chapitres dans l'ordre de leurs versets (les numéros sont du texte : "9A", "9B"...).
export function chaptersInReadingOrder(books, verses) {
  const labelsByBook = new Map(books.map((book) => [book.code, []]));
  for (const verse of verses) {
    const labels = labelsByBook.get(verse.code);
    if (labels && !labels.includes(verse.chapter)) labels.push(verse.chapter);
  }
  return books.flatMap((book) => labelsByBook.get(book.code).map((label) => ({ code: book.code, label })));
}
