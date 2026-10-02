// Assemble l'app : la barre de navigation, les pages (une adresse chacune), et le menu d'un verset
// (surligner, noter, copier), partagé par toutes les pages.
// Le routeur lui-même (BrowserRouter) est branché dans main.jsx : les tests utilisent un autre routeur.

import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import NavBar from './components/NavBar.jsx';
import VerseMenu from './components/VerseMenu.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import BiblePage from './pages/BiblePage.jsx';
import { useHighlights } from './highlights/useHighlights.js';
import { useNotes } from './notes/useNotes.js';
import { copyText } from './copy/clipboard.js';

// Les pages du site
const PAGES = [
  { to: '/', label: 'Histoire du salut' },
  { to: '/bible', label: 'Bible entière' },
];

function App() {
  const { highlights, toggle: toggleHighlight } = useHighlights();
  const { notes, save: saveNote } = useNotes();
  // Verset dont le menu est ouvert, { key: "Gn 1,3", text: "..." }, ou null si aucun
  const [menuVerse, setMenuVerse] = useState(null);

  // useMemo : le même objet tant que surlignages et notes ne changent pas.
  // Ouvrir le menu ne redessine donc pas les passages ni les chapitres (voir les memo de Passage, Chapter, VerseList).
  const annotations = useMemo(() => ({ highlights, notes, openMenu: setMenuVerse }), [highlights, notes]);

  return (
    <>
      <NavBar pages={PAGES} />
      <main>
        <Routes>
          <Route path="/" element={<HistoryPage annotations={annotations} />} />
          <Route path="/bible" element={<BiblePage annotations={annotations} />} />
          {/* Adresse inconnue : retour à l'histoire du salut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

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
    </>
  );
}

export default App;
