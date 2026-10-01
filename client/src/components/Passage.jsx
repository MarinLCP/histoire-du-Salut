// Affiche un passage : son titre, sa référence et ses versets.
// Reçoit un passage tel que renvoyé par l'API (un élément de GET /api/timeline).
// Un appui long (ou un clic droit) sur un verset ouvre son menu : surligner, écrire une note, copier.
// Le bouton "Partager" de l'en-tête partage un lien direct vers le passage.

import { memo } from 'react';
import StatusButton from './StatusButton.jsx';
import { passageReference, verseKey } from '../bible/reference.js';
import { useLongPress } from '../hooks/useLongPress.js';
import './Passage.css';

const SHARE_LABELS = { idle: 'Partager', done: 'Lien copié ✓', failed: 'Partage impossible' };

// annotations = { highlights, notes, openMenu } : ce que l'utilisateur a ajouté aux versets.
// openMenu({ key, text }) reçoit la référence du verset et son texte (pour le copier).
// onShare(passage) partage le passage (injectée par App, remplacée par un faux dans les tests).
function Passage({ passage, annotations, onShare }) {
  // Après la feuille de partage du téléphone (ou si on l'a fermée), rien à confirmer
  const share = () => onShare(passage).then((result) => (result === 'copied' ? 'done' : 'idle'));

  return (
    <article className="passage">
      <header className="passage-header">
        <div>
          <h2 className="passage-title">{passage.title}</h2>
          <p className="passage-reference">{passageReference(passage)}</p>
        </div>
        <StatusButton className="share-button" labels={SHARE_LABELS} action={share} />
      </header>

      {passage.verses.map((verse, index) => (
        <Verse key={index} verse={verse} bookCode={passage.book.code} annotations={annotations} />
      ))}
    </article>
  );
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
});

// Au clavier, un élément role="button" doit réagir à Entrée et à Espace, comme un vrai bouton
function openOnEnterOrSpace(event, openMenu) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  // Sans ça, Espace ferait aussi défiler la page
  event.preventDefault();
  openMenu();
}

// memo : un passage déjà affiché ne se redessine pas quand la timeline charge la page suivante
export default memo(Passage);
