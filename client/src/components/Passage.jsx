// Affiche un passage : son titre, sa référence et ses versets.
// Reçoit un passage tel que renvoyé par l'API (un élément de GET /api/timeline).
// Un appui long (ou un clic droit) sur un verset ouvre son menu : surligner, écrire une note.

import { verseKey } from '../highlights/highlights.js';
import { useLongPress } from '../hooks/useLongPress.js';
import './Passage.css';

// annotations = { highlights, notes, openMenu } : ce que l'utilisateur a ajouté aux versets
function Passage({ passage, annotations }) {
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
          verseKey={verseKey(passage.book.code, verse)}
          annotations={annotations}
        />
      ))}
    </article>
  );
}

// Une ligne sans numéro (ex. "ELLE" dans le Cantique) n'est pas un verset : pas de menu
function Verse({ verse, verseKey, annotations }) {
  if (verse.kind === 'unnumbered') {
    return <p className="verse verse-unnumbered">{verse.text}</p>;
  }
  return <NumberedVerse verse={verse} verseKey={verseKey} annotations={annotations} />;
}

// Composant séparé : un hook (useLongPress) ne peut pas être appelé après un return conditionnel
function NumberedVerse({ verse, verseKey, annotations }) {
  const openMenu = () => annotations.openMenu(verseKey);
  const longPressHandlers = useLongPress(openMenu);
  const isHighlighted = annotations.highlights.has(verseKey);
  const note = annotations.notes.get(verseKey);

  return (
    <>
      <p
        className={isHighlighted ? 'verse verse-highlighted' : 'verse'}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        {...longPressHandlers}
        onKeyDown={(event) => openOnEnterOrSpace(event, openMenu)}
      >
        <sup className="verse-number">{verse.verse}</sup>
        {verse.text}
      </p>
      {note && <p className="verse-note">{note.text}</p>}
    </>
  );
}

// Au clavier, un élément role="button" doit réagir à Entrée et à Espace, comme un vrai bouton
function openOnEnterOrSpace(event, openMenu) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  // Sans ça, Espace ferait aussi défiler la page
  event.preventDefault();
  openMenu();
}

// "Gn 1, 1-5" ou, sur deux chapitres, "Gn 1, 1 – 2, 25"
function formatReference({ book, start, end }) {
  if (start.chapter === end.chapter) {
    return `${book.title} ${start.chapter}, ${start.verse}-${end.verse}`;
  }
  return `${book.title} ${start.chapter}, ${start.verse} – ${end.chapter}, ${end.verse}`;
}

export default Passage;
