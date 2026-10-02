// Page « Histoire du salut » (adresse /) : la timeline des épisodes, depuis le début
// ou depuis un lien partagé (/?passage=creation). À gauche, la frise (cachée en ligne : flag "frise").

import Timeline from '../components/Timeline.jsx';
import ListStatus from '../components/ListStatus.jsx';
import Frise from '../frise/Frise.jsx';
import { sharePassage } from '../share/share.js';
import { useStartPosition } from '../share/useStartPosition.js';
import { hasFeature } from '../features/features.js';
import './HistoryPage.css';

const TAB_NAMES = ["Vue d'ensemble", 'Épisodes', 'Chapitres'];

// annotations : surlignages, notes et ouverture du menu d'un verset (partagés par toutes les pages)
function HistoryPage({ annotations }) {
  const startAfter = useStartPosition();

  // Lien partagé : on attend de savoir où commencer avant d'afficher la timeline
  if (startAfter === null) return <ListStatus isLoading />;
  const timeline = <Timeline startAfter={startAfter} annotations={annotations} onShare={sharePassage} />;
  if (!hasFeature('frise')) return timeline;

  return (
    <div className="with-frise">
      <Frise mode="history" tabNames={TAB_NAMES} />
      <div className="with-frise-reading">{timeline}</div>
    </div>
  );
}

export default HistoryPage;
