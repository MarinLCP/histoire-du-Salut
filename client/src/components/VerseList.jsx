// Les versets d'un passage ou d'un chapitre. Un appui long (ou un clic droit, ou Entrée au clavier)
// sur un verset ouvre son menu : surligner, écrire une note, copier.
// La référence d'un verset ("Gn 1,3") est la même partout : un verset surligné dans la Bible entière
// l'est aussi dans l'histoire du salut.
// Un verset où commence un sous-chapitre est précédé de son intertitre (verse.sectionTitle).

import { Fragment, memo } from 'react';
import { verseKey } from '../bible/reference.js';
import { useLongPress } from '../hooks/useLongPress.js';
import './VerseList.css';

// annotations = { highlights, notes, openMenu } : ce que l'utilisateur a ajouté aux versets.
// openMenu({ key, text }) reçoit la référence du verset et son texte (pour le copier).
function VerseList({ verses, bookCode, annotations }) {
  return verses.map((verse, index) => (
    <Fragment key={index}>
      {verse.sectionTitle && <h4 className="verse-section">{verse.sectionTitle}</h4>}
      <Verse verse={verse} bookCode={bookCode} annotations={annotations} />
    </Fragment>
  ));
}

// Une ligne sans numéro (ex. "ELLE" dans le Cantique) n'est pas un verset : pas de menu
function Verse({ verse, bookCode, annotations }) {
  if (verse.kind === 'unnumbered') {
    return <p className="verse verse-unnumbered">{verse.text}</p>;
  }

  const key = verseKey(bookCode, verse);
  return (
    <NumberedVerse
      verse={verse}
      verseKey={key}
      isHighlighted={annotations.highlights.has(key)}
      note={annotations.notes.get(key)}
      onOpenMenu={annotations.openMenu}
    />
  );
}

// memo : un verset ne se redessine que si SES données changent (surligné, note...).
// Sans ça, ouvrir le menu ou surligner un verset redessinerait les milliers de versets à l'écran.
// Composant séparé aussi parce qu'un hook (useLongPress) ne peut pas suivre un return conditionnel.
const NumberedVerse = memo(function NumberedVerse({ verse, verseKey, isHighlighted, note, onOpenMenu }) {
  const openMenu = () => onOpenMenu({ key: verseKey, text: verse.text });
  const longPressHandlers = useLongPress(openMenu);

  return (
    <>
      {/* data-verse : un lien vers ce verset le retrouve ainsi (bible/useScrollToVerse.js) */}
      <p
        className={isHighlighted ? 'verse verse-highlighted' : 'verse'}
        data-verse={verseKey}
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
});

// Au clavier, un élément role="button" doit réagir à Entrée et à Espace, comme un vrai bouton
function openOnEnterOrSpace(event, openMenu) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  // Sans ça, Espace ferait aussi défiler la page
  event.preventDefault();
  openMenu();
}

export default VerseList;
