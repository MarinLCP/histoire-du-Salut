// Assemble l'app : la barre de navigation, les deux lectures (une adresse chacune), le menu d'un verset
// (surligner, noter, copier), partagé par les deux, le panneau des parallèles (Bible entière seulement)
// et le panneau Paramètres (dont « Mon compte »). Le compte et la bibliothèque du lecteur (notes,
// surlignages, marque-pages : useLibrary) sont gérés ici, une fois pour toutes les pages.
// Le routeur lui-même (BrowserRouter) est branché dans main.jsx : les tests utilisent un autre routeur.

import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import NavBar from './components/NavBar.jsx';
import VerseMenu from './components/VerseMenu.jsx';
import SettingsPanel from './settings/SettingsPanel.jsx';
import ParallelsPanel from './parallels/ParallelsPanel.jsx';
import BackupSection from './backup/BackupSection.jsx';
import AccountSection from './account/AccountSection.jsx';
import { useAccount } from './account/useAccount.js';
import { downloadJson } from './backup/downloadJson.js';
import HistoryPage from './pages/HistoryPage.jsx';
import BiblePage from './pages/BiblePage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import { useLibrary } from './library/useLibrary.js';
import { BookmarksContext } from './library/BookmarksContext.js';
import { copyText } from './copy/clipboard.js';
import { useSettings } from './settings/useSettings.js';

// Les pages du site
const PAGES = [
  { to: '/', label: 'Histoire du salut' },
  { to: '/bible', label: 'Bible entière' },
];

function App() {
  const account = useAccount();
  const library = useLibrary(account.user);
  const { highlights, notes } = library;
  // Verset dont le menu est ouvert, { key: "Gn 1,3", text, reference, canShowParallels }, ou null si aucun
  // (canShowParallels : ajouté par la page Bible entière, la seule qui propose les parallèles)
  const [menuVerse, setMenuVerse] = useState(null);
  // Verset dont les parallèles sont affichés (le même objet que menuVerse), ou null
  const [parallelsVerse, setParallelsVerse] = useState(null);
  const { settings, change: changeSettings } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // useMemo : le même objet tant que surlignages et notes ne changent pas.
  // Ouvrir le menu ne redessine donc pas les passages ni les chapitres (voir les memo de Passage, Chapter, VerseList).
  const annotations = useMemo(() => ({ highlights, notes, openMenu: setMenuVerse }), [highlights, notes]);

  // Le menu laisse la place au panneau des parallèles
  function showParallels(verse) {
    setMenuVerse(null);
    setParallelsVerse(verse);
  }

  return (
    <>
      <NavBar pages={PAGES} onOpenSettings={() => setIsSettingsOpen(true)} />
      <main>
        {/* Le marque-page de chaque lecture, pour la frise (compte ou navigateur) */}
        <BookmarksContext.Provider value={library.bookmarks}>
          <Routes>
            <Route path="/" element={<HistoryPage annotations={annotations} />} />
            <Route path="/bible" element={<BiblePage annotations={annotations} />} />
            {/* Où en est un lecteur, depuis le lien qu'il a partagé */}
            <Route path="/progression/:token" element={<ProgressPage />} />
            {/* Adresse inconnue : retour à l'histoire du salut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BookmarksContext.Provider>
      </main>

      {/* key : un nouveau menu (état remis à zéro) pour chaque verset */}
      {menuVerse && (
        <VerseMenu
          key={menuVerse.key}
          verseKey={menuVerse.key}
          verseText={menuVerse.text}
          isHighlighted={highlights.has(menuVerse.key)}
          note={notes.get(menuVerse.key)}
          onToggleHighlight={library.toggleHighlight}
          onSaveNote={library.saveNote}
          canSaveNotes={library.canSaveNotes}
          account={account}
          onCopy={copyText}
          onShowParallels={menuVerse.canShowParallels ? () => showParallels(menuVerse) : undefined}
          onClose={() => setMenuVerse(null)}
        />
      )}

      {parallelsVerse && (
        <ParallelsPanel key={parallelsVerse.key} verse={parallelsVerse} onClose={() => setParallelsVerse(null)} />
      )}

      {isSettingsOpen && (
        <SettingsPanel settings={settings} onChange={changeSettings} onClose={() => setIsSettingsOpen(false)}>
          <AccountSection account={account} waitingNotes={library.waitingNotes.size} />
          <BackupSection highlights={highlights} notes={library.canSaveNotes ? notes : library.waitingNotes}
            onDownload={downloadJson} onImport={library.importBackup} />
        </SettingsPanel>
      )}
    </>
  );
}

export default App;
