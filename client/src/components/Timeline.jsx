// La liste des passages de l'histoire du salut, chargée page par page au fil du défilement
// (même mécanisme que la Bible entière : useCursorPagination).

import { memo } from 'react';
import Passage from './Passage.jsx';
import ListStatus from './ListStatus.jsx';
import { fetchTimeline } from '../api/passages.api.js';
import { useCursorPagination } from '../hooks/useCursorPagination.js';
import './Timeline.css';

// Fonction stable (hors du composant) : le hook ne se relance pas à chaque affichage
const fetchPassages = (after) => fetchTimeline(after).then((page) => ({ items: page.passages, nextCursor: page.nextCursor }));

// startAfter : la timeline commence après cette position (0 = au début, plus si on arrive par un lien partagé)
// annotations et onShare : transmis tels quels aux passages
function Timeline({ startAfter, annotations, onShare }) {
  const { items: passages, sentinelRef, isLoading, error, isFinished, retry } =
    useCursorPagination(fetchPassages, startAfter);

  return (
    <div className="timeline">
      {/* Arrivé par un lien partagé : on peut revenir à la Création (l'adresse sans ?passage=) */}
      {startAfter > 0 && (
        <a className="list-back" href="/">
          ↑ Revenir au début de l'histoire
        </a>
      )}

      {passages.map((passage) => (
        <Passage key={passage.id} passage={passage} annotations={annotations} onShare={onShare} />
      ))}

      <ListStatus isLoading={isLoading} error={error} isFinished={isFinished} onRetry={retry}
        finishedText="Tu as parcouru toute l'histoire." />

      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}

// memo : ouvrir ou fermer le menu d'un verset (dans App) ne redessine pas la timeline
export default memo(Timeline);
