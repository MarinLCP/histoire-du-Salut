// Le panneau des parallèles d'un verset (à droite), ouvert depuis le menu du verset, dans les deux lectures :
// les 10 passages les plus votés par les lecteurs d'OpenBible.info, puis « Voir plus ».
// Un clic sur un parallèle ouvre la Bible entière à ce verset.
// - écran large (isDocked) : fixé à droite de la lecture, il reste ouvert (on lit à côté) ;
// - sinon : par-dessus la lecture (SidePanel), refermé par le clic.

import { Link } from 'react-router';
import SidePanel from '../components/SidePanel.jsx';
import DockedPanel from '../components/DockedPanel.jsx';
import ListStatus from '../components/ListStatus.jsx';
import { useParallels } from './useParallels.js';
import { rangeReference } from '../bible/reference.js';
import { verseLink } from '../bible/bibleLink.js';
import './ParallelsPanel.css';

const SOURCE_URL = 'https://www.openbible.info/labs/cross-references/';

// verse : { key: "Mt 11,14", reference: { book, chapter, verse } } (le verset du menu)
function ParallelsPanel({ verse, isDocked = false, onClose }) {
  const { parallels, isLoading, error, canLoadMore, loadMore } = useParallels(verse.reference);
  const Panel = isDocked ? DockedPanel : SidePanel;

  return (
    <Panel title={`Parallèles de ${verse.key}`} onClose={onClose}>
      <ol className="parallels-list">
        {parallels.map((parallel) => (
          <ParallelItem key={parallel.position} parallel={parallel} returnTo={verse.returnTo}
            onOpen={isDocked ? undefined : onClose} />
        ))}
      </ol>
      <ListStatus isLoading={isLoading} error={error} onRetry={loadMore}
        isFinished={parallels.length === 0} finishedText="Aucun parallèle pour ce verset." />
      {canLoadMore && <button type="button" className="parallels-more" onClick={loadMore}>Voir plus</button>}
      <p className="parallels-note">
        Parallèles : <a href={SOURCE_URL} target="_blank" rel="noreferrer">OpenBible.info</a> (CC-BY)
      </p>
    </Panel>
  );
}

// Un parallèle : sa référence, puis le début de son texte (« … » si la plage est plus longue que l'aperçu)
// returnTo : où revenir ensuite (le verset du menu), pour le bouton « Revenir à … »
function ParallelItem({ parallel, returnTo, onOpen }) {
  const preview = parallel.verses.map((verse) => verse.text).join(' ');

  return (
    <li>
      <Link className="parallel-link" to={verseLink(parallel.start)} state={{ returnTo }} onClick={onOpen}>
        <span className="parallel-reference">{rangeReference(parallel.start, parallel.end)}</span>
        <span className="parallel-text">{parallel.isTruncated ? `${preview} …` : preview}</span>
      </Link>
    </li>
  );
}

export default ParallelsPanel;
