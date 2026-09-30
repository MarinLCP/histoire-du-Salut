// Affiche un passage : son titre, sa référence et ses versets.
// Reçoit un passage tel que renvoyé par l'API (un élément de GET /api/timeline).
// Toucher ou cliquer sur un verset le surligne (ou retire le surlignage).

import { verseKey } from '../highlights/highlights.js';
import './Passage.css';

function Passage({ passage, highlights, onToggleHighlight }) {
  return (
    <article className="passage">
      <header>
        <h2 className="passage-title">{passage.title}</h2>
        <p className="passage-reference">{formatReference(passage)}</p>
      </header>

      {passage.verses.map((verse, index) => (
        <Verse
          key={index}
          verse={verse}
          highlightKey={verseKey(passage.book.code, verse)}
          highlights={highlights}
          onToggleHighlight={onToggleHighlight}
        />
      ))}
    </article>
  );
}

// Un verset avec son numéro, ou une ligne sans numéro (ex. "ELLE" dans le Cantique)
function Verse({ verse, highlightKey, highlights, onToggleHighlight }) {
  // Les lignes sans numéro ne sont pas des versets : on ne peut pas les surligner
  if (verse.kind === 'unnumbered') {
    return <p className="verse verse-unnumbered">{verse.text}</p>;
  }

  const isHighlighted = highlights.has(highlightKey);
  const toggle = () => onToggleHighlight(highlightKey);

  return (
    <p
      className={isHighlighted ? 'verse verse-highlighted' : 'verse'}
      role="button"
      tabIndex={0}
      aria-pressed={isHighlighted}
      onClick={() => toggleUnlessSelectingText(toggle)}
      onKeyDown={(event) => toggleOnEnterOrSpace(event, toggle)}
    >
      <sup className="verse-number">{verse.verse}</sup>
      {verse.text}
    </p>
  );
}

// Sur ordinateur, sélectionner du texte à la souris finit par un clic : on ne surligne pas dans ce cas
function toggleUnlessSelectingText(toggle) {
  if (window.getSelection().toString() !== '') return;
  toggle();
}

// Au clavier, un élément role="button" doit réagir à Entrée et à Espace, comme un vrai bouton
function toggleOnEnterOrSpace(event, toggle) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  // Sans ça, Espace ferait aussi défiler la page
  event.preventDefault();
  toggle();
}

// "Gn 1, 1-5" ou, sur deux chapitres, "Gn 1, 1 – 2, 25"
function formatReference({ book, start, end }) {
  if (start.chapter === end.chapter) {
    return `${book.title} ${start.chapter}, ${start.verse}-${end.verse}`;
  }
  return `${book.title} ${start.chapter}, ${start.verse} – ${end.chapter}, ${end.verse}`;
}

export default Passage;
