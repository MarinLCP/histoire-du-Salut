// Assemble l'app : la barre de navigation, les deux lectures (une adresse chacune), le menu d'un verset
// (surligner, noter, poser le marque-page, copier, parallèles), partagé par les deux, le panneau des parallèles (à droite)
// et le panneau « Compte et réglages » (dont « Mon compte »). Le compte et la bibliothèque du lecteur (notes,
// surlignages, marque-pages : useLibrary) sont gérés ici, une fois pour toutes les pages.
// Sur les deux lectures, la présentation du site aux nouveaux venus (useOnboarding) : les cartes d'accueil,
// puis l'astuce de l'appui long.
// Le routeur lui-même (BrowserRouter) est branché dans main.jsx : les tests utilisent un autre routeur.

import { useCallback, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import NavBar from './components/NavBar.jsx';
import VerseMenu from './components/VerseMenu.jsx';
import SettingsPanel from './settings/SettingsPanel.jsx';
import ParallelsPanel from './parallels/ParallelsPanel.jsx';
import AccountSection from './account/AccountSection.jsx';
import InstallSection from './install/InstallSection.jsx';
import WelcomeCards from './onboarding/WelcomeCards.jsx';
import LongPressHint from './onboarding/LongPressHint.jsx';
import { useOnboarding } from './onboarding/useOnboarding.js';
import { useAccount } from './account/useAccount.js';
import HistoryPage from './pages/HistoryPage.jsx';
import BiblePage from './pages/BiblePage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import { useLibrary } from './library/useLibrary.js';
import { BookmarksContext } from './library/BookmarksContext.js';
import { ReadingPositionsContext } from './library/ReadingPositionsContext.js';
import { copyText } from './copy/clipboard.js';
import { verseReadingPosition } from './frise/readingPosition.js';
import { useSettings } from './settings/useSettings.js';
import { useMediaQuery } from './hooks/useMediaQuery.js';

// Assez large pour la frise, la lecture ET le panneau des parallèles fixé à droite
const WIDE_SCREEN = '(min-width: 1300px)';

// Les pages du site
const PAGES = [
  { to: '/', label: 'Histoire du salut', shortLabel: 'Histoire' },
  { to: '/bible', label: 'Bible entière', shortLabel: 'Bible' },
];

function App() {
  const account = useAccount();
  const library = useLibrary(account.user);
  const { highlights, notes } = library;
  // Verset dont le menu est ouvert, { key: "Gn 1,3", text, reference, returnTo, readingMode }, ou null si aucun
  const [menuVerse, setMenuVerse] = useState(null);
  // Verset dont les parallèles sont affichés (le même objet que menuVerse), ou null
  const [parallelsVerse, setParallelsVerse] = useState(null);
  const isWide = useMediaQuery(WIDE_SCREEN);
  const isParallelsDocked = isWide && parallelsVerse !== null;
  const { settings, change: changeSettings } = useSettings();
  // Retour d'une connexion Google ratée (/?connexion=echec) : Paramètres s'ouvre et le dit
  const location = useLocation();
  const googleFailed = new URLSearchParams(location.search).get('connexion') === 'echec';
  // La présentation du site ne s'affiche que sur les deux lectures (pas sur un lien de partage ni sur la page
  // Confidentialité)
  const isReadingPage = PAGES.some((page) => page.to === location.pathname);
  const onboarding = useOnboarding();
  const { dismissHint } = onboarding;
  const [isSettingsOpen, setIsSettingsOpen] = useState(googleFailed);

  // useMemo : le même objet tant que surlignages et notes ne changent pas.
  // Ouvrir le menu ne redessine donc pas les passages ni les chapitres (voir les memo de Passage, Chapter, VerseList).
  const placedBookmarks = library.bookmarks.placed;
  // Ouvrir le menu d'un verset : l'astuce de l'appui long a servi, elle ne revient plus
  const openMenu = useCallback((verse) => {
    setMenuVerse(verse);
    dismissHint();
  }, [dismissHint]);
  const annotations = useMemo(
    () => ({ highlights, notes, placedBookmarks, openMenu }),
    [highlights, notes, placedBookmarks, openMenu],
  );

  // useCallback : la même fonction d'un affichage à l'autre (le panneau fixé écoute Échap avec elle)
  const closeParallels = useCallback(() => setParallelsVerse(null), []);

  // Le marque-page de la lecture du verset ouvert : posé sur lui (il ne bouge plus avec la lecture), ou retiré
  // s'il y était
  const isMenuVerseBookmarked = menuVerse !== null && placedBookmarks[menuVerse.readingMode] === menuVerse.key;
  function toggleBookmark() {
    const { key, readingMode } = menuVerse;
    if (isMenuVerseBookmarked) return library.bookmarks.remove(readingMode);
    const position = verseReadingPosition(key);
    if (position !== null) library.bookmarks.place(readingMode, key, position);
  }

  // Le menu laisse la place au panneau des parallèles
  function showParallels(verse) {
    setMenuVerse(null);
    setParallelsVerse(verse);
  }

  return (
    <>
      <NavBar pages={PAGES} onOpenSettings={() => setIsSettingsOpen(true)} />
      {/* Le panneau des parallèles fixé à droite : la lecture lui laisse la place */}
      <main className={isParallelsDocked ? 'with-docked-panel' : undefined}>
        {/* Le marque-page de chaque lecture, pour la frise, et où on en est, pour y revenir (compte ou navigateur) */}
        <BookmarksContext.Provider value={library.bookmarks}>
          <ReadingPositionsContext.Provider value={library.readings}>
            <Routes>
              <Route path="/" element={<HistoryPage annotations={annotations} />} />
              <Route path="/bible" element={<BiblePage annotations={annotations} />} />
              {/* Où en est un lecteur, depuis le lien qu'il a partagé */}
              <Route path="/progression/:token" element={<ProgressPage />} />
              {/* Confidentialité et mentions légales (RGPD) */}
              <Route path="/confidentialite" element={<PrivacyPage />} />
              {/* Adresse inconnue : retour à l'histoire du salut */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ReadingPositionsContext.Provider>
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
          noteStatus={library.status}
          account={account}
          onHoldNote={library.holdNote}
          onReleaseNote={library.releaseNote}
          onCopy={copyText}
          onShowParallels={() => showParallels(menuVerse)}
          isBookmarked={isMenuVerseBookmarked}
          onToggleBookmark={menuVerse.readingMode ? toggleBookmark : undefined}
          onClose={() => { library.releaseNote(); setMenuVerse(null); }}
        />
      )}

      {parallelsVerse && (
        <ParallelsPanel key={parallelsVerse.key} verse={parallelsVerse} isDocked={isWide}
          onClose={closeParallels} />
      )}

      {isReadingPage && onboarding.isWelcomeOpen && <WelcomeCards onClose={onboarding.closeWelcome} />}
      {isReadingPage && onboarding.isHintVisible && <LongPressHint onDismiss={dismissHint} />}

      {isSettingsOpen && (
        <SettingsPanel settings={settings} onChange={changeSettings} onClose={() => setIsSettingsOpen(false)}
          onShowWelcome={isReadingPage ? () => { setIsSettingsOpen(false); onboarding.openWelcome(); } : undefined}>
          <AccountSection account={account} waitingNotes={library.waitingNotes.size}
            libraryStatus={library.status} onRetryLibrary={library.retry} googleFailed={googleFailed} />
          <InstallSection />
        </SettingsPanel>
      )}
    </>
  );
}

export default App;
