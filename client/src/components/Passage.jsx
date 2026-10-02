// Affiche un passage : son titre, sa référence et ses versets.
// Reçoit un passage tel que renvoyé par l'API (un élément de GET /api/timeline).
// Un appui long (ou un clic droit) sur un verset ouvre son menu (voir VerseList.jsx).
// Le bouton "Partager" de l'en-tête partage un lien direct vers le passage.

import { memo } from 'react';
import StatusButton from './StatusButton.jsx';
import VerseList from './VerseList.jsx';
import { passageReference } from '../bible/reference.js';
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

      <VerseList verses={passage.verses} bookCode={passage.book.code} annotations={annotations} />
    </article>
  );
}

// memo : un passage déjà affiché ne se redessine pas quand la timeline charge la page suivante
export default memo(Passage);
