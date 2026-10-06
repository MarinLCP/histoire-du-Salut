// Menu d'un verset, ouvert par un appui long : surligner, écrire une note, copier, et (dans la Bible
// entière seulement) voir ses parallèles.
// Utilise la balise <dialog> du navigateur : fond grisé, touche Échap et focus sont gérés pour nous.
// Affiché comme un panneau qui monte du bas de l'écran (bottom sheet), pratique au pouce sur mobile.

import { useState } from 'react';
import StatusButton from './StatusButton.jsx';
import { formatVerseForCopy } from '../copy/copyVerse.js';
import { useModalDialog } from '../hooks/useModalDialog.js';
import './VerseMenu.css';

// onCopy(text) : copie le texte et renvoie une promesse (injectée par App, remplacée par un faux dans les tests)
// onShowParallels : ouvre le panneau des parallèles ; absent = pas de bouton (histoire du salut)
function VerseMenu({
  verseKey, verseText, isHighlighted, note, onToggleHighlight, onSaveNote, onCopy, onShowParallels, onClose,
}) {
  const { dialogRef, backdropProps } = useModalDialog(onClose);
  const [isEditingNote, setIsEditingNote] = useState(false);

  function toggleHighlightAndClose() {
    onToggleHighlight(verseKey);
    onClose();
  }

  function saveNoteAndClose(text) {
    onSaveNote(verseKey, text);
    onClose();
  }

  return (
    <dialog ref={dialogRef} className="verse-menu" onClose={onClose} {...backdropProps}>
      <div className="verse-menu-content">
        <h2 className="verse-menu-title">{verseKey}</h2>
        {isEditingNote ? (
          <NoteEditor note={note} onSave={saveNoteAndClose} onCancel={() => setIsEditingNote(false)} />
        ) : (
          <VerseActions
            isHighlighted={isHighlighted}
            note={note}
            copiedText={formatVerseForCopy(verseKey, verseText)}
            onToggleHighlight={toggleHighlightAndClose}
            onEditNote={() => setIsEditingNote(true)}
            onCopy={onCopy}
            onShowParallels={onShowParallels}
            onClose={onClose}
          />
        )}
      </div>
    </dialog>
  );
}

function VerseActions({ isHighlighted, note, copiedText, onToggleHighlight, onEditNote, onCopy, onShowParallels, onClose }) {
  return (
    <div className="verse-menu-buttons">
      <button onClick={onToggleHighlight}>{isHighlighted ? 'Retirer le surlignage' : 'Surligner'}</button>
      <button onClick={onEditNote}>{note ? 'Modifier la note' : 'Ajouter une note'}</button>
      {/* Le menu reste ouvert pour que l'utilisateur voie "Verset copié ✓" */}
      <StatusButton labels={COPY_LABELS} action={() => onCopy(copiedText).then(() => 'done')} />
      {onShowParallels && <button onClick={onShowParallels}>Voir les parallèles</button>}
      <button onClick={onClose}>Fermer</button>
    </div>
  );
}

const COPY_LABELS = { idle: 'Copier le verset', done: 'Verset copié ✓', failed: 'Copie impossible' };

function NoteEditor({ note, onSave, onCancel }) {
  const [text, setText] = useState(note?.text ?? '');

  return (
    <>
      <textarea
        className="verse-menu-textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Ce que ce verset me dit…"
        aria-label="Ma note"
        rows={5}
        autoFocus
      />
      <div className="verse-menu-buttons">
        <button className="verse-menu-primary" onClick={() => onSave(text)}>Enregistrer</button>
        {note && <button onClick={() => onSave('')}>Supprimer la note</button>}
        <button onClick={onCancel}>Annuler</button>
      </div>
    </>
  );
}

export default VerseMenu;
