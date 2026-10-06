// Menu d'un verset, ouvert par un appui long : surligner, écrire une note, copier, et (dans la Bible
// entière seulement) voir ses parallèles. Les notes sont gardées dans le compte : sans compte,
// « Enregistrer » propose d'en créer un (ou de se connecter), puis enregistre la note.
// Utilise la balise <dialog> du navigateur : fond grisé, touche Échap et focus sont gérés pour nous.
// Affiché comme un panneau qui monte du bas de l'écran (bottom sheet), pratique au pouce sur mobile.

import { useEffect, useState } from 'react';
import StatusButton from './StatusButton.jsx';
import SignInForm from '../account/SignInForm.jsx';
import { formatVerseForCopy } from '../copy/copyVerse.js';
import { useModalDialog } from '../hooks/useModalDialog.js';
import './VerseMenu.css';

// onCopy(text) : copie le texte et renvoie une promesse (injectée par App, remplacée par un faux dans les tests)
// onShowParallels : ouvre le panneau des parallèles ; absent = pas de bouton (histoire du salut)
// canSaveNotes : un compte est connecté (et chargé) ; account : useAccount(), pour en créer un ici
function VerseMenu({
  verseKey, verseText, isHighlighted, note, onToggleHighlight, onSaveNote, canSaveNotes, account, onCopy,
  onShowParallels, onClose,
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
          <NoteEditor note={note} canSave={canSaveNotes} account={account} onSave={saveNoteAndClose}
            onCancel={() => setIsEditingNote(false)} />
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

function NoteEditor({ note, canSave, account, onSave, onCancel }) {
  const [text, setText] = useState(note?.text ?? '');
  const [isAskingAccount, setIsAskingAccount] = useState(false);

  // Le compte vient d'être créé (ou ouvert) et chargé : la note qui attendait est enregistrée
  useEffect(() => {
    if (isAskingAccount && canSave) onSave(text);
  }, [isAskingAccount, canSave, onSave, text]);

  if (isAskingAccount) return <AccountPrompt account={account} onCancel={() => setIsAskingAccount(false)} />;
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
        <button className="verse-menu-primary" onClick={() => (canSave ? onSave(text) : setIsAskingAccount(true))}>
          Enregistrer
        </button>
        {note && <button onClick={() => onSave('')}>Supprimer la note</button>}
        <button onClick={onCancel}>Annuler</button>
      </div>
    </>
  );
}

// Sans compte : la note attend (son texte est gardé) le temps de créer un compte ou de se connecter
function AccountPrompt({ account, onCancel }) {
  return (
    <div className="verse-menu-account">
      <p>Crée un compte pour garder tes notes : elles restent privées, et tu les retrouves sur tous tes appareils.</p>
      <SignInForm account={account} startWith="create" />
      <button onClick={onCancel}>Revenir à ma note</button>
    </div>
  );
}

export default VerseMenu;
