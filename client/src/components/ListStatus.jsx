// Le message affiché en bas d'une liste chargée au fil du défilement (timeline, Bible entière) :
// chargement, erreur (avec « Réessayer ») ou fin de la liste (finishedText).
// aria-live : les lecteurs d'écran annoncent le message quand il change.

import './ListStatus.css';

function ListStatus({ isLoading, error, isFinished, onRetry, finishedText }) {
  if (error) {
    return (
      <div className="list-status" role="alert">
        <p>{error}</p>
        <button className="list-retry" onClick={onRetry}>
          Réessayer
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <p className="list-status" aria-live="polite">Chargement…</p>;
  }

  if (isFinished) {
    return (
      <p className="list-status list-end" aria-live="polite">
        {finishedText}
      </p>
    );
  }

  return null;
}

export default ListStatus;
