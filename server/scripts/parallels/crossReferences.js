// Lecture du fichier des parallèles d'OpenBible.info (cross_references.txt, licence CC-BY) : fonction pure.
// Une ligne = « verset de départ <tab> verset ou plage d'arrivée <tab> votes », ex. « Gen.1.1  John.1.1-John.1.3  379 ».
// Les références sont en anglais et dans la numérotation des Bibles protestantes : voir versification.js.

const REFERENCE = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/;
const MIN_VOTES = 1; // un vote nul ou négatif : des lecteurs ont jugé le lien faux (décision de Marin)

// Renvoie [{ from, to: { start, end }, votes }], une référence étant { book, chapter, verse } (nombres)
export function parseCrossReferences(text) {
  const lines = text.split('\n');
  const links = [];
  // La 1re ligne est l'en-tête des colonnes : la ligne d'index 0 après elle est la ligne n° 2 du fichier
  lines.slice(1).forEach((line, index) => {
    if (line.trim() === '') return;
    const link = parseLine(line, index + 2);
    if (link.votes >= MIN_VOTES) links.push(link);
  });
  return links;
}

function parseLine(line, lineNumber) {
  const [from, to, votes] = line.split('\t');
  const [start, end = start] = to.split('-');
  return {
    from: parseReference(from, lineNumber),
    to: { start: parseReference(start, lineNumber), end: parseReference(end, lineNumber) },
    votes: Number(votes),
  };
}

function parseReference(text, lineNumber) {
  const match = REFERENCE.exec(text);
  if (!match) throw new Error(`Ligne ${lineNumber} : référence « ${text} » illisible.`);
  return { book: match[1], chapter: Number(match[2]), verse: Number(match[3]) };
}
