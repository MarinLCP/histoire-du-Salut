// Page « où en est un lecteur » (adresse /progression/<jeton>), ouverte depuis un lien qu'il a partagé :
// son pseudo, l'épisode de l'histoire du salut et le chapitre de la Bible entière où il en est, avec de quoi
// lire au même endroit. Pas besoin de compte pour l'ouvrir ; ni e-mail ni notes (elles sont privées).

import { Link, useParams } from 'react-router';
import ListStatus from '../components/ListStatus.jsx';
import { fetchProgress } from '../api/sharing.api.js';
import { chapterLink } from '../bible/bibleLink.js';
import { useLoaded } from '../hooks/useLoaded.js';
import './ProgressPage.css';

// Le chargement a échoué (lien inconnu, arrêté, ou serveur injoignable)
const UNAVAILABLE = 'unavailable';

function ProgressPage() {
  const { token } = useParams();
  const progress = useLoaded(token, fetchProgress, null, UNAVAILABLE);

  return (
    <section className="progress-page" aria-labelledby="progress-title">
      <ProgressContent progress={progress} />
    </section>
  );
}

function ProgressContent({ progress }) {
  if (progress === null) return <ListStatus isLoading />;
  if (progress === UNAVAILABLE) {
    return <h1 id="progress-title">Ce lien de partage n'existe pas, ou plus.</h1>;
  }
  return (
    <>
      <h1 id="progress-title">Où en est {progress.displayName}</h1>
      {!progress.history && !progress.bible && <p>{progress.displayName} n'a pas encore commencé sa lecture.</p>}
      {progress.history && <HistoryProgress history={progress.history} />}
      {progress.bible && <BibleProgress bible={progress.bible} />}
    </>
  );
}

function HistoryProgress({ history }) {
  return (
    <article className="progress-card">
      <h2>L'histoire du salut</h2>
      <p>Épisode {history.episode} sur {history.total} : <strong>{history.title}</strong></p>
      <Link to={`/?passage=${encodeURIComponent(history.slug)}`}>Lire au même endroit</Link>
    </article>
  );
}

function BibleProgress({ bible }) {
  return (
    <article className="progress-card">
      <h2>La Bible entière</h2>
      <p><strong>{bible.book.title}</strong>, chapitre {bible.chapter}</p>
      <Link to={chapterLink(bible.book.code, bible.chapter)}>Lire au même endroit</Link>
    </article>
  );
}

export default ProgressPage;
