// La liste des passages, chargée page par page depuis l'API.
// Pour l'instant avec un bouton "Charger la suite" : le scroll infini viendra en V3.4.

import { useEffect, useState } from 'react';
import Passage from './Passage.jsx';
import { fetchTimeline } from '../api/passages.js';
import './Timeline.css';

function Timeline() {
  const [passages, setPassages] = useState([]);
  // Position après laquelle charger la page suivante ; null = on est arrivé au bout
  const [nextCursor, setNextCursor] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ajoute une page de passages à la suite de ceux déjà affichés
  function addPage(page) {
    setPassages((previous) => [...previous, ...page.passages]);
    setNextCursor(page.nextCursor);
  }

  function loadNextPage() {
    setIsLoading(true);
    fetchTimeline(nextCursor)
      .then(addPage)
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setIsLoading(false));
  }

  // Première page, au premier affichage
  useEffect(() => {
    // Si le composant disparaît avant la réponse, on ignore celle-ci
    // (en dev, le StrictMode de React lance cet effet deux fois exprès)
    let ignore = false;

    fetchTimeline(0)
      .then((page) => {
        if (!ignore) addPage(page);
      })
      .catch((fetchError) => {
        if (!ignore) setError(fetchError.message);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="timeline">
      {passages.map((passage) => (
        <Passage key={passage.id} passage={passage} />
      ))}

      {/* États simples pour l'instant : ils seront soignés en V3.5 */}
      {error && <p className="timeline-status">{error}</p>}

      {nextCursor !== null && !error && (
        <button className="timeline-more" onClick={loadNextPage} disabled={isLoading}>
          {isLoading ? 'Chargement…' : 'Charger la suite'}
        </button>
      )}
    </div>
  );
}

export default Timeline;
