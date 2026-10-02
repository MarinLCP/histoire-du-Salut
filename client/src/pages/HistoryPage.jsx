// Page « Histoire du salut » (adresse /) : la timeline des épisodes, depuis le début
// ou depuis un lien partagé (/?passage=creation).

import Timeline from '../components/Timeline.jsx';
import TimelineStatus from '../components/TimelineStatus.jsx';
import { sharePassage } from '../share/share.js';
import { useStartPosition } from '../share/useStartPosition.js';

// annotations : surlignages, notes et ouverture du menu d'un verset (partagés par toutes les pages)
function HistoryPage({ annotations }) {
  const startAfter = useStartPosition();

  // Lien partagé : on attend de savoir où commencer avant d'afficher la timeline
  if (startAfter === null) return <TimelineStatus isLoading />;
  return <Timeline startAfter={startAfter} annotations={annotations} onShare={sharePassage} />;
}

export default HistoryPage;
