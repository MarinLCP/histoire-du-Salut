// La liste des passages, chargée page par page depuis l'API (scroll infini).
// Un élément invisible (la "sentinelle") est placé tout en bas de la liste :
// quand il approche de l'écran, on charge la page suivante.

import { useEffect, useRef, useState } from 'react';
import Passage from './Passage.jsx';
import TimelineStatus from './TimelineStatus.jsx';
import { fetchTimeline } from '../api/passages.api.js';
import './Timeline.css';

// On charge la suite un peu AVANT que l'utilisateur n'arrive en bas (600px avant)
const PRELOAD_DISTANCE = '600px';

// startAfter : la timeline commence après cette position (0 = au début, plus si on arrive par un lien partagé)
// annotations et onShare : transmis tels quels aux passages
function Timeline({ startAfter, annotations, onShare }) {
  const [passages, setPassages] = useState([]);
  // Position après laquelle charger la page suivante ; null = on est arrivé au bout
  const [nextCursor, setNextCursor] = useState(startAfter);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  const canLoadMore = nextCursor !== null && !isLoading && !error;

  function loadPage(after) {
    setIsLoading(true);
    fetchTimeline(after)
      .then((page) => {
        setPassages((previous) => [...previous, ...page.passages]);
        setNextCursor(page.nextCursor);
      })
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setIsLoading(false));
  }

  // Surveille la sentinelle. Le premier chargement passe aussi par ici :
  // au départ la liste est vide, donc la sentinelle est déjà visible.
  useEffect(() => {
    if (!canLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        // On arrête d'observer tout de suite : une seule page chargée à la fois
        observer.disconnect();
        loadPage(nextCursor);
      },
      { rootMargin: PRELOAD_DISTANCE },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, nextCursor]);

  return (
    <div className="timeline">
      {/* Arrivé par un lien partagé : on peut revenir à la Création (l'adresse sans ?passage=) */}
      {startAfter > 0 && (
        <a className="timeline-back" href="/">
          ↑ Revenir au début de l'histoire
        </a>
      )}

      {passages.map((passage) => (
        <Passage key={passage.id} passage={passage} annotations={annotations} onShare={onShare} />
      ))}

      {/* Réessayer = effacer l'erreur : canLoadMore redevient vrai et l'observateur relance le chargement */}
      <TimelineStatus
        isLoading={isLoading}
        error={error}
        isFinished={nextCursor === null}
        onRetry={() => setError(null)}
      />

      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}

export default Timeline;
