// Les versets d'un passage ou d'un chapitre. Un appui long (ou un clic droit, ou Entrée au clavier)
// sur un verset ouvre son menu : surligner, écrire une note, copier.
// La référence d'un verset ("Gn 1,3") est la même partout : un verset surligné dans la Bible entière
// l'est aussi dans l'histoire du salut.
// Un verset où commence un sous-chapitre est précédé de son intertitre (verse.sectionTitle).
// À côté de chaque verset (ou dessous, si la lecture est étroite) : ses parallèles les plus votés (MarginParallels),
// arrivés avec lui (verse.parallels) : le texte s'affiche une seule fois, déjà complet. Dans la Bible entière
// seulement : les épisodes n'en reçoivent pas (ils gardent « Voir les parallèles » dans le menu du verset).
// Le verset où le lecteur a posé le marque-page de cette lecture le montre (« Marque-page »).

import { Fragment, memo, useContext } from 'react';
import { verseKey } from '../bible/reference.js';
import { useLongPress } from '../hooks/useLongPress.js';
import MarginParallels from '../parallels/MarginParallels.jsx';
import { returnPoint } from '../bible/returnPoint.js';
import { ReadingModeContext } from '../frise/ReadingModeContext.js';
import './VerseList.css';


// annotations = { highlights, notes, placedBookmarks, openMenu } : ce que l'utilisateur a ajouté aux versets ;
// placedBookmarks : le verset du marque-page posé à la main, par lecture ({ history: "Gn 1,3" }).
// openMenu({ key, text, reference, returnTo, readingMode }) reçoit la référence du verset ("Gn 1,3", et en
// morceaux : { book, chapter, verse }), son texte (pour le copier), où revenir après un parallèle (returnTo)
// et sa lecture ('history' | 'bible', ou null hors d'une lecture).
// returnHref : l'adresse de cette lecture si ce n'est pas la Bible entière (l'épisode : "/?passage=chute")
function VerseList({ verses, bookCode, annotations, returnHref }) {
  const readingMode = useContext(ReadingModeContext);
  return verses.map((verse, index) => (
    <Fragment key={index}>
      {verse.sectionTitle && <h4 className="verse-section">{verse.sectionTitle}</h4>}
      <Verse verse={verse} bookCode={bookCode} annotations={annotations} returnHref={returnHref} readingMode={readingMode} />
    </Fragment>
  ));
}

// Une ligne sans numéro (ex. "ELLE" dans le Cantique) n'est pas un verset : pas de menu
function Verse({ verse, bookCode, annotations, returnHref, readingMode }) {
  if (verse.kind === 'unnumbered') {
    return <p className="verse verse-unnumbered">{verse.text}</p>;
  }

  const key = verseKey(bookCode, verse);
  return (
    <NumberedVerse
      verse={verse}
      bookCode={bookCode}
      verseKey={key}
      returnHref={returnHref}
      readingMode={readingMode}
      isHighlighted={annotations.highlights.has(key)}
      isBookmarked={annotations.placedBookmarks?.[readingMode] === key}
      note={annotations.notes.get(key)}
      onOpenMenu={annotations.openMenu}
    />
  );
}

// memo : un verset ne se redessine que si SES données changent (surligné, note...).
// Sans ça, ouvrir le menu ou surligner un verset redessinerait les milliers de versets à l'écran.
// Composant séparé aussi parce qu'un hook (useLongPress) ne peut pas suivre un return conditionnel.
const NumberedVerse = memo(function NumberedVerse({
  verse, bookCode, verseKey, returnHref, readingMode, isHighlighted, isBookmarked, note, onOpenMenu,
}) {
  const reference = { book: bookCode, chapter: verse.chapter, verse: verse.verse };
  const returnTo = returnPoint(verseKey, reference, returnHref);
  const openMenu = () => onOpenMenu({ key: verseKey, text: verse.text, reference, returnTo, readingMode });
  const longPressHandlers = useLongPress(openMenu);

  return (
    <div className="verse-row">
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
      {verse.parallels?.length > 0 && <MarginParallels parallels={verse.parallels} returnTo={returnTo} />}
      {isBookmarked && <BookmarkTag />}
      {note && <p className="verse-note">{note.text}</p>}
    </div>
  );
});

// Le marque-page posé sur ce verset : le même ruban que dans la frise
function BookmarkTag() {
  return (
    <p className="verse-bookmark">
      <svg viewBox="0 0 16 26" aria-hidden="true"><path d="M1 0h14v24l-7-6-7 6z" /></svg>
      Marque-page
    </p>
  );
}

// Au clavier, un élément role="button" doit réagir à Entrée et à Espace, comme un vrai bouton
function openOnEnterOrSpace(event, openMenu) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  // Sans ça, Espace ferait aussi défiler la page
  event.preventDefault();
  openMenu();
}

export default VerseList;
