// Affiche un passage : son titre, sa référence et ses versets.
// Reçoit un passage tel que renvoyé par l'API (un élément de GET /api/timeline).

import './Passage.css';

function Passage({ passage }) {
  return (
    <article className="passage">
      <header>
        <h2 className="passage-title">{passage.title}</h2>
        <p className="passage-reference">{formatReference(passage)}</p>
      </header>

      {passage.verses.map((verse, index) => (
        <Verse key={index} verse={verse} />
      ))}
    </article>
  );
}

// Un verset avec son numéro, ou une ligne sans numéro (ex. "ELLE" dans le Cantique)
function Verse({ verse }) {
  if (verse.kind === 'unnumbered') {
    return <p className="verse verse-unnumbered">{verse.text}</p>;
  }

  return (
    <p className="verse">
      <sup className="verse-number">{verse.verse}</sup>
      {verse.text}
    </p>
  );
}

// "Gn 1, 1-5" ou, sur deux chapitres, "Gn 1, 1 – 2, 25"
function formatReference({ book, start, end }) {
  if (start.chapter === end.chapter) {
    return `${book.title} ${start.chapter}, ${start.verse}-${end.verse}`;
  }
  return `${book.title} ${start.chapter}, ${start.verse} – ${end.chapter}, ${end.verse}`;
}

export default Passage;
