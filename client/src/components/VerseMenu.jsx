// Menu d'un verset, ouvert par un appui long : surligner, écrire une note, copier, voir ses parallèles
// (panneau à droite). Pas de bouton « Fermer » : un toucher à côté du menu, ou Échap, le referme. Les notes sont gardées dans le compte : sans compte,
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
// onShowParallels : ouvre le panneau des parallèles
// noteStatus : où vont les notes (useLibrary().status) ; account : useAccount(), pour en créer un ici ;
// onHoldNote(key, text) / onReleaseNote() : mettre de côté (ou oublier) la note tapée sans compte
function VerseMenu({
  verseKey, verseText, isHighlighted, note, onToggleHighlight, onSaveNote, noteStatus, account, onHoldNote,
  onReleaseNote, onCopy, onShowParallels, onClose,
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
          <NoteEditor note={note} status={noteStatus} account={account} onSave={saveNoteAndClose}
            onHold={(text) => onHoldNote(verseKey, text)} onRelease={onReleaseNote} onDone={onClose}
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
          />
        )}
      </div>
    </dialog>
  );
}

function VerseActions({ isHighlighted, note, copiedText, onToggleHighlight, onEditNote, onCopy, onShowParallels }) {
  return (
    <div className="verse-menu-buttons">
      <button onClick={onToggleHighlight}>{isHighlighted ? 'Retirer le surlignage' : 'Surligner'}</button>
      <button onClick={onEditNote}>{note ? 'Modifier la note' : 'Ajouter une note'}</button>
      {/* Le menu reste ouvert pour que l'utilisateur voie "Verset copié ✓" */}
      <StatusButton labels={COPY_LABELS} action={() => onCopy(copiedText).then(() => 'done')} />
      <button onClick={onShowParallels}>Voir les parallèles</button>
    </div>
  );
}

const COPY_LABELS = { idle: 'Copier le verset', done: 'Verset copié ✓', failed: 'Copie impossible' };

// status : où vont les notes (useLibrary) : 'ready' (compte chargé), 'local' (pas de compte),
// 'loading' / 'failed' (compte pas encore chargé, ou injoignable)
function NoteEditor({ note, status, account, onSave, onHold, onRelease, onDone, onCancel }) {
  const [text, setText] = useState(note?.text ?? '');
  const [isAskingAccount, setIsAskingAccount] = useState(false);
  const canWait = status === 'ready' || status === 'local';

  // Le compte vient d'être créé (ou ouvert) et chargé : la note mise de côté l'a rejoint, le menu se ferme
  useEffect(() => {
    if (isAskingAccount && status === 'ready') onDone();
  }, [isAskingAccount, status, onDone]);

  function save() {
    if (status === 'ready') return onSave(text);
    onHold(text);
    setIsAskingAccount(true);
  }

  if (isAskingAccount) {
    return <AccountPrompt account={account} onCancel={() => { onRelease(); setIsAskingAccount(false); }} />;
  }
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
      {!canWait && <p className="verse-menu-status" role="status">{NOT_READY[status]}</p>}
      <div className="verse-menu-buttons">
        <button className="verse-menu-primary" onClick={save} disabled={!canWait}>Enregistrer</button>
        {note && <button onClick={() => onSave('')}>Supprimer la note</button>}
        <button onClick={onCancel}>Annuler</button>
      </div>
    </>
  );
}

const NOT_READY = {
  loading: 'Ton compte se charge…',
  failed: 'Ton compte ne répond pas : réessaie depuis « Mon compte », dans un instant.',
};

// Sans compte : la note est mise de côté le temps de créer un compte ou de se connecter ; elle le rejoint
// ensuite (si le compte a déjà une note sur ce verset, la plus récente gagne : celle-ci)
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
