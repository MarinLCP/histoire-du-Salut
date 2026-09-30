// Assemble l'app : la timeline des passages, et le menu d'un verset (surligner, noter).

import { useState } from 'react';
import Timeline from './components/Timeline.jsx';
import VerseMenu from './components/VerseMenu.jsx';
import { useHighlights } from './highlights/useHighlights.js';
import { useNotes } from './notes/useNotes.js';

function App() {
  const { highlights, toggle: toggleHighlight } = useHighlights();
  const { notes, save: saveNote } = useNotes();
  // Référence du verset dont le menu est ouvert ("Gn 1,3"), ou null si aucun
  const [menuVerseKey, setMenuVerseKey] = useState(null);

  const annotations = { highlights, notes, openMenu: setMenuVerseKey };

  return (
    <main>
      <Timeline annotations={annotations} />

      {/* key : un nouveau menu (état remis à zéro) pour chaque verset */}
      {menuVerseKey && (
        <VerseMenu
          key={menuVerseKey}
          verseKey={menuVerseKey}
          isHighlighted={highlights.has(menuVerseKey)}
          note={notes.get(menuVerseKey)}
          onToggleHighlight={toggleHighlight}
          onSaveNote={saveNote}
          onClose={() => setMenuVerseKey(null)}
        />
      )}
    </main>
  );
}

export default App;
