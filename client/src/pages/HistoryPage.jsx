// Page « Histoire du salut » (adresse /) : la timeline des épisodes, depuis le début
// ou depuis un lien partagé (/?passage=creation). À gauche, la frise (mode Histoire du salut).
// Même structure que la Bible entière (BiblePage.jsx) : la page garde le saut demandé par la frise,
// la lecture (recréée quand l'adresse change) sait où commencer.

import { useLocation } from 'react-router';
import Timeline from '../components/Timeline.jsx';
import ListStatus from '../components/ListStatus.jsx';
import ReadingWithFrise from '../frise/ReadingWithFrise.jsx';
import { sharePassage } from '../share/share.js';
import { useStartPosition } from '../share/useStartPosition.js';
import { useJump } from '../frise/useJump.js';

const TAB_NAMES = ["Vue d'ensemble", 'Épisodes', 'Chapitres'];

// annotations : surlignages, notes et ouverture du menu d'un verset (partagés par toutes les pages)
function HistoryPage({ annotations }) {
  const { search, state } = useLocation();
  // Retour d'un parallèle (« Revenir à … ») : la lecture défile jusqu'au verset de départ
  const targetVerse = state?.scrollToVerse ?? null;
  // Un clic dans la frise vers un passage pas encore chargé : la timeline recommence à ce passage
  const [jumpStart, jumpTo] = useJump();

  return (
    <ReadingWithFrise mode="history" tabNames={TAB_NAMES} onJump={jumpTo}>
      {/* key : une autre adresse (lien partagé, ou retour au début) = une lecture recommencée de zéro */}
      <HistoryReading key={search} search={search} jumpStart={jumpStart} targetVerse={targetVerse} annotations={annotations} />
    </ReadingWithFrise>
  );
}

// Où commencer (au début, au passage du lien, ou au passage choisi dans la frise), puis la timeline
function HistoryReading({ search, jumpStart, targetVerse, annotations }) {
  const linkStart = useStartPosition(search);
  const startAfter = jumpStart ?? linkStart;

  // Lien partagé : on attend de savoir où commencer avant d'afficher la timeline
  if (startAfter === null) return <ListStatus isLoading />;
  // key : un autre point de départ = une timeline rechargée depuis ce passage
  return <Timeline key={startAfter} startAfter={startAfter} targetVerse={targetVerse} annotations={annotations} onShare={sharePassage} />;
}

export default HistoryPage;
