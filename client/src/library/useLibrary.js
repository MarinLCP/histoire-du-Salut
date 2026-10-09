// Hook React : la bibliothèque du lecteur (notes privées, surlignages, marque-pages, positions de lecture), au
// bon endroit :
// - pas connecté (status 'local') : surlignages, marque-page et positions dans le navigateur ; pas de notes (il
//   faut un compte). Les notes déjà écrites dans ce navigateur (avant les comptes) attendent la connexion ;
// - connecté : à l'ouverture, ce qui est dans le navigateur rejoint le compte (le plus récent gagne), puis le
//   navigateur est vidé (les notes sont privées : un appareil peut être partagé), sauf les positions de lecture
//   (l'app les retrouve à l'ouverture sans attendre le serveur). Pendant ce temps, status vaut
//   'loading' ; ensuite 'ready' (chaque changement est affiché tout de suite et écrit dans le compte, annulé si
//   l'écriture échoue), ou 'failed' (retry() réessaie).
// user : useAccount().user (undefined : pas encore su ; null : pas connecté ; { email })

import { useEffect, useMemo, useRef, useState } from 'react';
import { toggleHighlight as toggledHighlights } from '../highlights/highlights.js';
import { loadHighlights, saveHighlights } from '../highlights/highlights.storage.js';
import { setNote } from '../notes/notes.js';
import { loadNotes, saveNotes } from '../notes/notes.storage.js';
import {
  loadBookmarks, saveBookmark as saveLocalBookmark, removeBookmark as removeLocalBookmark, clearBookmarks,
} from '../frise/bookmark.storage.js';
import { loadReadingPositions, saveReadingPosition } from '../frise/readingPositions.storage.js';
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
  const readings = useReadingPositions(email, account.status, loaded?.readings ?? null);

  return {
    status: account.status,
    retry: account.retry,
    notes: loaded ? loaded.notes : NO_NOTES,
    highlights: loaded ? loaded.highlights : localHighlights,
    // Les notes écrites dans ce navigateur, qui attendent la connexion
    waitingNotes: localNotes,
    bookmarks,
    readings,
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
  // { email, status: 'ready' | 'failed', library: { notes, highlights, bookmarks, readings } (des Map) }
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
      write.catch(() => update((library) => ({ notes: withEntry(library.notes, key, before) })));
    },
  };
}

// Les marque-pages posés à la main, pour la frise et les versets (BookmarksContext) : le même objet tant que le
// compte et les marque-pages ne changent pas (surligner ou noter ne redessine pas la frise).
// - saved : ceux du compte une fois chargé, sinon ceux du navigateur ; lus une fois, puis changés tout de suite
//   quand le lecteur en pose ou en retire un ;
// - placed : le verset de chaque marque-page ({ history: "Gn 1,3" }) ;
// - place(mode, verse, position) : poser le marque-page sur un verset ; remove(mode) : le retirer. Annulé à
//   l'écran si l'écriture dans le compte échoue.
// source : les marque-pages du compte (une Map) une fois chargés, sinon BROWSER (ceux du navigateur)
function useBookmarks(email, accountBookmarks) {
  const source = accountBookmarks ?? BROWSER;
  const [shown, setShown] = useState(() => ({ source, bookmarks: initialBookmarks(source) }));
  // Le compte vient d'être chargé (ou quitté) : on repart de ses marque-pages (calcul pendant l'affichage,
  // comme le conseille React, plutôt qu'un effet qui afficherait d'abord les anciens)
  if (shown.source !== source) setShown({ source, bookmarks: initialBookmarks(source) });

  const saved = shown.bookmarks;
  return useMemo(() => {
    // Poser (bookmark) ou retirer (null) le marque-page d'une lecture : tout de suite à l'écran, puis écrit
    const change = (mode, bookmark) => {
      const before = saved.get(mode);
      const show = (value) => setShown((previous) => ({ ...previous, bookmarks: withEntry(previous.bookmarks, mode, value) }));
      show(bookmark);
      if (!email) return bookmark ? saveLocalBookmark(mode, bookmark) : removeLocalBookmark(mode);
      const write = bookmark ? libraryApi.saveBookmark(mode, bookmark) : libraryApi.removeBookmark(mode);
      write.catch(() => show(before));
    };
    return {
      saved,
      placed: Object.fromEntries([...saved].map(([mode, bookmark]) => [mode, bookmark.verse])),
      place: (mode, verse, position) => change(mode, { position, verse }),
      remove: (mode) => change(mode, null),
    };
  }, [saved, email]);
}

// Où le lecteur en est dans chaque lecture (ReadingPositionsContext) :
// - latest(mode) : où revenir à l'ouverture : la position la plus récente entre cet appareil et le compte ;
//   undefined tant que le compte se charge (on attend pour choisir), null s'il n'y en a aucune ;
// - save(mode, position) : retenue sur cet appareil, et dans le compte si on est connecté ;
// - resumed : les lectures déjà reprises depuis l'ouverture (useReadingMemory n'y revient qu'une fois).
// status : celui de la bibliothèque du compte ; accountReadings : ses positions (une Map) une fois chargées
function useReadingPositions(email, status, accountReadings) {
  // Celles de cet appareil, lues à l'ouverture (la lecture ne revient qu'à l'ouverture)
  const [deviceReadings] = useState(loadReadingPositions);
  const [resumed] = useState(() => new Set());

  return useMemo(() => {
    const latest = (mode) => {
      if (status === 'loading') return undefined;
      const candidates = [deviceReadings.get(mode), accountReadings?.get(mode)].filter(Boolean);
      const newest = candidates.sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
      return newest?.position ?? null;
    };
    const save = (mode, position) => {
      saveReadingPosition(mode, position);
      if (email) libraryApi.saveReading(mode, position).catch(() => {});
    };
    return { latest, save, resumed };
  }, [email, status, accountReadings, deviceReadings, resumed]);
}

// Les marque-pages lus au départ : ceux du compte (une Map), ou ceux du navigateur
const BROWSER = 'browser';
const initialBookmarks = (source) => (source === BROWSER ? loadBookmarks() : source);

// Ce qui attend dans le navigateur (et la note mise de côté), au format d'échange avec le serveur
function browserLibrary(heldNote) {
  const notes = Object.fromEntries(loadNotes());
  if (heldNote) notes[heldNote.key] = { text: heldNote.text, updatedAt: heldNote.updatedAt };
  return {
    notes,
    highlights: Object.fromEntries(loadHighlights()),
    bookmarks: Object.fromEntries(loadBookmarks()),
    readings: Object.fromEntries(loadReadingPositions()),
  };
}

const isEmpty = (library) => Object.values(library).every((group) => Object.keys(group).length === 0);

// Chaque groupe de la bibliothèque (un objet) en Map
const asMaps = (library) => Object.fromEntries(Object.entries(library).map(([name, group]) => [name, new Map(Object.entries(group))]));

// Une copie de la Map où la valeur de cette clé est remplacée, ou retirée (value vide). Sert à poser un
// marque-page, et à remettre la note d'avant quand une écriture a échoué
function withEntry(map, key, value) {
  const next = new Map(map);
  next.delete(key);
  if (value) next.set(key, value);
  return next;
}
