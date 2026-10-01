// Assemble l'app : la timeline des passages (depuis le début, ou depuis un lien partagé),
// et le menu d'un verset (surligner, noter, copier).

import { useMemo, useState } from 'react';
import Timeline from './components/Timeline.jsx';
import TimelineStatus from './components/TimelineStatus.jsx';
import VerseMenu from './components/VerseMenu.jsx';
import { useHighlights } from './highlights/useHighlights.js';
import { useNotes } from './notes/useNotes.js';
import { copyText } from './copy/clipboard.js';
import { sharePassage } from './share/share.js';
import { useStartPosition } from './share/useStartPosition.js';

function App() {
  const { highlights, toggle: toggleHighlight } = useHighlights();
  const { notes, save: saveNote } = useNotes();
  // Verset dont le menu est ouvert, { key: "Gn 1,3", text: "..." }, ou null si aucun
  const [menuVerse, setMenuVerse] = useState(null);
  const startAfter = useStartPosition();

  // useMemo : le même objet tant que surlignages et notes ne changent pas.
  // Ouvrir le menu ne redessine donc pas toute la timeline (voir memo dans Passage.jsx).
  const annotations = useMemo(() => ({ highlights, notes, openMenu: setMenuVerse }), [highlights, notes]);

  return (
    <main>
      {/* Lien partagé : on attend de savoir où commencer avant d'afficher la timeline */}
      {startAfter === null ? (
        <TimelineStatus isLoading />
      ) : (
        <Timeline startAfter={startAfter} annotations={annotations} onShare={sharePassage} />
      )}

      {/* key : un nouveau menu (état remis à zéro) pour chaque verset */}
      {menuVerse && (
        <VerseMenu
          key={menuVerse.key}
          verseKey={menuVerse.key}
          verseText={menuVerse.text}
          isHighlighted={highlights.has(menuVerse.key)}
          note={notes.get(menuVerse.key)}
          onToggleHighlight={toggleHighlight}
          onSaveNote={saveNote}
          onCopy={copyText}
          onClose={() => setMenuVerse(null)}
        />
      )}
    </main>
  );
}

export default App;
