// Le panneau des parallèles d'un verset (Bible entière seulement), ouvert depuis le menu du verset :
// les 10 passages les plus votés par les lecteurs d'OpenBible.info, puis « Voir plus ».
// Un clic sur un parallèle ouvre la Bible entière à ce verset (et referme le panneau).

import { Link } from 'react-router';
import SidePanel from '../components/SidePanel.jsx';
import ListStatus from '../components/ListStatus.jsx';
import { useParallels } from './useParallels.js';
import { rangeReference } from '../bible/reference.js';
import { verseLink } from '../bible/bibleLink.js';
import './ParallelsPanel.css';

const SOURCE_URL = 'https://www.openbible.info/labs/cross-references/';

// verseKey : la référence du verset ("Mt 11,14")
function ParallelsPanel({ verseKey, onClose }) {
  const { parallels, isLoading, error, canLoadMore, loadMore } = useParallels(verseKey);
  const isEmpty = !isLoading && !error && parallels.length === 0;

  return (
    <SidePanel title={`Parallèles de ${verseKey}`} onClose={onClose}>
      <ol className="parallels-list">
        {parallels.map((parallel) => (
          <ParallelItem key={parallel.position} parallel={parallel} onOpen={onClose} />
        ))}
      </ol>
      {isEmpty && <p className="parallels-note">Aucun parallèle pour ce verset.</p>}
      <ListStatus isLoading={isLoading} error={error} onRetry={loadMore} />
      {canLoadMore && <button type="button" className="parallels-more" onClick={loadMore}>Voir plus</button>}
      <p className="parallels-note">
        Parallèles : <a href={SOURCE_URL} target="_blank" rel="noreferrer">OpenBible.info</a> (CC-BY)
      </p>
    </SidePanel>
  );
}

// Un parallèle : sa référence, puis le début de son texte (« … » si la plage est plus longue que l'aperçu)
function ParallelItem({ parallel, onOpen }) {
  const preview = parallel.verses.map((verse) => verse.text).join(' ');

  return (
    <li>
      <Link className="parallel-link" to={verseLink(parallel.start)} onClick={onOpen}>
        <span className="parallel-reference">{rangeReference(parallel.start, parallel.end)}</span>
        <span className="parallel-text">{parallel.isTruncated ? `${preview} …` : preview}</span>
      </Link>
    </li>
  );
}

export default ParallelsPanel;
