// Le message affiché en bas de la timeline : chargement, erreur ou fin de l'histoire.
// aria-live : les lecteurs d'écran annoncent le message quand il change.

function TimelineStatus({ isLoading, error, isFinished, onRetry }) {
  if (error) {
    return (
      <div className="timeline-status" role="alert">
        <p>{error}</p>
        <button className="timeline-retry" onClick={onRetry}>
          Réessayer
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <p className="timeline-status" aria-live="polite">Chargement…</p>;
  }

  if (isFinished) {
    return (
      <p className="timeline-status timeline-end" aria-live="polite">
        Tu as parcouru toute l'histoire.
      </p>
    );
  }

  return null;
}

export default TimelineStatus;
