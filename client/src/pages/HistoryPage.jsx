// Page « Histoire du salut » (adresse /) : la timeline des épisodes, depuis le début
// ou depuis un lien partagé (/?passage=creation). À gauche, la frise (cachée en ligne : flag "frise").

import Timeline from '../components/Timeline.jsx';
import ListStatus from '../components/ListStatus.jsx';
import ReadingWithFrise from '../frise/ReadingWithFrise.jsx';
import { sharePassage } from '../share/share.js';
import { useStartPosition } from '../share/useStartPosition.js';
import { useJump } from '../frise/useJump.js';

const TAB_NAMES = ["Vue d'ensemble", 'Épisodes', 'Chapitres'];

// annotations : surlignages, notes et ouverture du menu d'un verset (partagés par toutes les pages)
function HistoryPage({ annotations }) {
  const sharedStart = useStartPosition();
  // Un clic dans la frise vers un passage pas encore chargé : la timeline recommence à ce passage
  const [jumpStart, jumpTo] = useJump();
  const startAfter = jumpStart ?? sharedStart;

  // Lien partagé : on attend de savoir où commencer avant d'afficher la timeline
  if (startAfter === null) return <ListStatus isLoading />;

  return (
    <ReadingWithFrise mode="history" tabNames={TAB_NAMES} onJump={jumpTo}>
      {/* key : un autre point de départ = une timeline rechargée depuis ce passage */}
      <Timeline key={startAfter} startAfter={startAfter} annotations={annotations} onShare={sharePassage} />
    </ReadingWithFrise>
  );
}

export default HistoryPage;
