// Petites règles d'écriture du seed (fonctions pures, testées).

// Pour insérer plusieurs lignes en UNE requête : "($1, $2, $3), ($4, $5, $6)" pour 2 lignes de 3 colonnes.
// Les valeurs sont ensuite passées à part (rows.flat()) : jamais collées dans le SQL.
export function placeholdersFor(rows) {
  return rows.map((row, rowIndex) => placeholdersForRow(rowIndex, row.length)).join(', ');
}

// La ligne n° 1 (2e ligne) de 3 colonnes utilise $4, $5, $6
function placeholdersForRow(rowIndex, columnCount) {
  const firstNumber = rowIndex * columnCount + 1;
  const numbers = Array.from({ length: columnCount }, (_, offset) => `$${firstNumber + offset}`);
  return `(${numbers.join(', ')})`;
}

// Quelques lignes de la source n'ont pas de numéro (ex. "ELLE" dans le Cantique)
export function verseKind(verse) {
  return verse.verse === null ? 'unnumbered' : 'verse';
}
