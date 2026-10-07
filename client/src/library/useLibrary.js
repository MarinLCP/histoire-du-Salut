// Hook React : la bibliothèque du lecteur (notes privées, surlignages, marque-pages), au bon endroit :
// - pas connecté (status 'local') : surlignages et marque-page dans le navigateur ; pas de notes (il faut un
//   compte). Les notes déjà écrites dans ce navigateur (avant les comptes, ou importées) attendent la connexion ;
// - connecté : à l'ouverture, ce qui est dans le navigateur rejoint le compte (le plus récent gagne), puis le
//   navigateur est vidé (les notes sont privées : un appareil peut être partagé). Pendant ce temps, status vaut
//   'loading' ; ensuite 'ready' (chaque changement est affiché tout de suite et écrit dans le compte, annulé si
//   l'écriture échoue), ou 'failed' (retry() réessaie).
// user : useAccount().user (undefined : pas encore su ; null : pas connecté ; { email })

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toggleHighlight as toggledHighlights } from '../highlights/highlights.js';
import { loadHighlights, saveHighlights } from '../highlights/highlights.storage.js';
import { setNote } from '../notes/notes.js';
import { loadNotes, saveNotes } from '../notes/notes.storage.js';
import {
  loadBookmarks, saveBookmark as saveLocalBookmark, removeBookmark as removeLocalBookmark, clearBookmarks,
} from '../frise/bookmark.storage.js';
import { useStoredMap } from '../storage/useStoredMap.js';
import * as libraryApi from '../api/library.api.js';

const NO_NOTES = new Map();

export function useLibrary(user) {
  const [localNotes, setLocalNotes] = useStoredMap(loadNotes, saveNotes);
  const [localHighlights, setLocalHighlights] = useStoredMap(loadHighlights, saveHighlights);
  const email = user?.email ?? null;
  const account = useAccountLibrary(email, { setLocalNotes, setLocalHighlights });
  const loaded = account.status === 'ready' ? account.library : null;
  const bookmarks = useBookmarks(email, loaded?.bookmarks ?? null);

  return {
    status: account.status,
    retry: account.retry,
    notes: loaded ? loaded.notes : NO_NOTES,
    highlights: loaded ? loaded.highlights : localHighlights,
    // Les notes écrites dans ce navigateur, qui attendent la connexion
    waitingNotes: localNotes,
    bookmarks,
    // Sans compte : la note tapée est mise de côté, et rejoint le compte à la connexion (le plus récent gagne)
    holdNote: account.holdNote,
    releaseNote: account.releaseNote,

    toggleHighlight(key) {
      if (!loaded) return setLocalHighlights((previous) => toggledHighlights(previous, key));
      account.toggleHighlight(key);
    },
    saveNote: account.saveNote,
  };
}

// La bibliothèque du compte : chargement (avec ce qui attend dans le navigateur), état, écritures
function useAccountLibrary(email, { setLocalNotes, setLocalHighlights }) {
  // { email, status: 'ready' | 'failed', library: { notes, highlights, bookmarks } (des Map) }
  const [state, setState] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const heldNote = useRef(null);
  const current = email !== null && state?.email === email ? state : null;
  const status = email === null ? 'local' : (current?.status ?? 'loading');

  useEffect(() => {
    if (!email) return;
    let ignore = false;
    const waiting = browserLibrary(heldNote.current);
    const load = isEmpty(waiting) ? libraryApi.fetchLibrary() : libraryApi.mergeLibrary(waiting);
    load
      .then((library) => {
        if (ignore) return;
        heldNote.current = null;
        setLocalNotes(new Map());
        setLocalHighlights(new Map());
        clearBookmarks();
        setState({ email, status: 'ready', library: asMaps(library) });
      })
      .catch(() => { if (!ignore) setState({ email, status: 'failed' }); });
    return () => {
      ignore = true;
    };
  }, [email, attempt, setLocalNotes, setLocalHighlights]);

  const update = (change) => setState((previous) => ({ ...previous, library: { ...previous.library, ...change(previous.library) } }));

  return {
    status,
    library: current?.library,
    retry() {
      setState(null);
      setAttempt((count) => count + 1);
    },
    holdNote(key, text) {
      heldNote.current = { key, text, updatedAt: new Date().toISOString() };
    },
    releaseNote() {
      heldNote.current = null;
    },
    toggleHighlight(key) {
      const write = current.library.highlights.has(key) ? libraryApi.removeHighlight : libraryApi.addHighlight;
      const toggle = () => update((library) => ({ highlights: toggledHighlights(library.highlights, key) }));
      toggle();
      write(key).catch(toggle);
    },
    saveNote(key, text) {
      if (status !== 'ready') return;
      const before = current.library.notes.get(key);
      update((library) => ({ notes: setNote(library.notes, key, text) }));
      const write = text.trim() === '' ? libraryApi.deleteNote(key) : libraryApi.saveNote(key, text);
      write.catch(() => update((library) => ({ notes: restored(library.notes, key, before) })));
    },
  };
}

// Les marque-pages, pour la frise et les versets (BookmarksContext) : le même objet tant que le compte et les
// marque-pages posés à la main ne changent pas (surligner ou noter ne redessine pas la frise).
// - saved : ceux du compte une fois chargé, sinon ceux du navigateur ; lus une fois, puis seuls les
//   marque-pages posés (ou retirés) à la main y changent, tout de suite ;
// - save(mode, position) : la lecture avance (le serveur ne déplace pas un marque-page posé à la main) ;
// - place(mode, verse, position) : poser le marque-page sur un verset ; remove(mode) : le retirer (la lecture
//   le reprendra). Annulé à l'écran si l'écriture dans le compte échoue.
function useBookmarks(email, accountBookmarks) {
  const source = accountBookmarks ?? BROWSER;
  const [shown, setShown] = useState(() => ({ source, bookmarks: initialBookmarks(source) }));
  // Le compte vient d'être chargé (ou quitté) : on repart de ses marque-pages (calcul pendant l'affichage,
  // comme le conseille React, plutôt qu'un effet qui afficherait d'abord les anciens)
  if (shown.source !== source) setShown({ source, bookmarks: initialBookmarks(source) });

  const save = useCallback((mode, position) => {
    if (!email) return saveLocalBookmark(mode, { position, verse: null });
    libraryApi.saveBookmark(mode, { position }).catch(() => {});
  }, [email]);

  const change = useCallback((mode, bookmark, before) => {
    const show = (value) => setShown((previous) => ({ ...previous, bookmarks: withBookmark(previous.bookmarks, mode, value) }));
    show(bookmark);
    if (!email) return bookmark ? saveLocalBookmark(mode, bookmark) : removeLocalBookmark(mode);
    const write = bookmark ? libraryApi.saveBookmark(mode, bookmark) : libraryApi.removeBookmark(mode);
    write.catch(() => show(before));
  }, [email]);

  const saved = shown.bookmarks;
  return useMemo(() => ({
    saved,
    save,
    place: (mode, verse, position) => change(mode, { position, verse }, saved.get(mode)),
    remove: (mode) => change(mode, null, saved.get(mode)),
  }), [saved, save, change]);
}

// Les marque-pages lus au départ : ceux du compte (une Map), ou ceux du navigateur
const BROWSER = 'browser';
const initialBookmarks = (source) => (source === BROWSER ? loadBookmarks() : source);

// Une copie de bookmarks où le marque-page de cette lecture est remplacé (ou retiré : bookmark vide)
function withBookmark(bookmarks, mode, bookmark) {
  const next = new Map(bookmarks);
  next.delete(mode);
  if (bookmark) next.set(mode, bookmark);
  return next;
}

// Ce qui attend dans le navigateur (et la note mise de côté), au format d'échange avec le serveur
function browserLibrary(heldNote) {
  const notes = Object.fromEntries(loadNotes());
  if (heldNote) notes[heldNote.key] = { text: heldNote.text, updatedAt: heldNote.updatedAt };
  return { notes, highlights: Object.fromEntries(loadHighlights()), bookmarks: Object.fromEntries(loadBookmarks()) };
}

function isEmpty({ notes, highlights, bookmarks }) {
  return [notes, highlights, bookmarks].every((group) => Object.keys(group).length === 0);
}

function asMaps({ notes, highlights, bookmarks }) {
  return { notes: new Map(Object.entries(notes)), highlights: new Map(Object.entries(highlights)), bookmarks: new Map(Object.entries(bookmarks)) };
}

// La note d'avant (ou plus de note) : pour annuler une écriture qui a échoué
function restored(notes, key, before) {
  const next = new Map(notes);
  next.delete(key);
  if (before) next.set(key, before);
  return next;
}
