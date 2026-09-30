// La liste des passages, chargée page par page depuis l'API (scroll infini).
// Un élément invisible (la "sentinelle") est placé tout en bas de la liste :
// quand il approche de l'écran, on charge la page suivante.

import { useEffect, useRef, useState } from 'react';
import Passage from './Passage.jsx';
import { fetchTimeline } from '../api/passages.js';
import './Timeline.css';

// On charge la suite un peu AVANT que l'utilisateur n'arrive en bas (600px avant)
const PRELOAD_DISTANCE = '600px';

function Timeline() {
  const [passages, setPassages] = useState([]);
  // Position après laquelle charger la page suivante ; null = on est arrivé au bout
  const [nextCursor, setNextCursor] = useState(0);
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
      {passages.map((passage) => (
        <Passage key={passage.id} passage={passage} />
      ))}

      {/* États simples pour l'instant : ils seront soignés en V3.5 */}
      {isLoading && <p className="timeline-status">Chargement…</p>}
      {error && <p className="timeline-status">{error}</p>}

      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}

export default Timeline;
