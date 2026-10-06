// Hook React : la bibliothèque du lecteur (notes privées, surlignages, marque-pages), au bon endroit :
// - pas connecté : surlignages et marque-page dans le navigateur ; pas de notes (il faut un compte). Les
//   notes déjà écrites dans ce navigateur (avant les comptes, ou importées) attendent la connexion ;
// - connecté : à l'ouverture, ce qui est dans le navigateur rejoint le compte (le plus récent gagne), puis
//   le navigateur est vidé (les notes sont privées : un appareil peut être partagé). Ensuite, chaque
//   changement est affiché tout de suite et écrit dans le compte (annulé si l'écriture échoue).
// user : useAccount().user (undefined : pas encore su ; null : pas connecté ; { email })

import { useEffect, useMemo, useState } from 'react';
import { toggleHighlight as toggledHighlights } from '../highlights/highlights.js';
import { loadHighlights, saveHighlights } from '../highlights/highlights.storage.js';
import { setNote } from '../notes/notes.js';
import { loadNotes, saveNotes } from '../notes/notes.storage.js';
import { loadBookmarks, saveBookmark as saveLocalBookmark } from '../frise/bookmark.storage.js';
import { useStoredMap } from '../storage/useStoredMap.js';
import { mergeInto } from '../backup/backup.js';
import * as libraryApi from '../api/library.api.js';

const NO_NOTES = new Map();

export function useLibrary(user) {
  const [localNotes, setLocalNotes] = useStoredMap(loadNotes, saveNotes);
  const [localHighlights, setLocalHighlights] = useStoredMap(loadHighlights, saveHighlights);
  const [localBookmarks] = useState(loadBookmarks);
  // La bibliothèque du compte, une fois chargée : { email, notes, highlights, bookmarks } (des Map)
  const [accountLibrary, setAccountLibrary] = useState(null);
  const email = user?.email ?? null;
  const loaded = email !== null && accountLibrary?.email === email ? accountLibrary : null;

  useAccountLoading(email, { setAccountLibrary, setLocalNotes, setLocalHighlights });

  const updateLoaded = (change) => setAccountLibrary((previous) => ({ ...previous, ...change(previous) }));
  const bookmarks = useMemo(() => ({
    saved: loaded ? loaded.bookmarks : localBookmarks,
    save: (mode, position) => {
      saveLocalBookmark(mode, position);
      if (email) libraryApi.saveBookmark(mode, position).catch(() => {});
    },
  }), [loaded, localBookmarks, email]);

  return {
    notes: loaded ? loaded.notes : NO_NOTES,
    highlights: loaded ? loaded.highlights : localHighlights,
    // Les notes écrites dans ce navigateur, qui attendent la connexion
    waitingNotes: loaded ? NO_NOTES : localNotes,
    // Enregistrer une note demande un compte, chargé
    canSaveNotes: loaded !== null,
    bookmarks,

    toggleHighlight(key) {
      if (!loaded) return setLocalHighlights((previous) => toggledHighlights(previous, key));
      const write = loaded.highlights.has(key) ? libraryApi.removeHighlight : libraryApi.addHighlight;
      const toggle = () => updateLoaded((previous) => ({ highlights: toggledHighlights(previous.highlights, key) }));
      toggle();
      write(key).catch(toggle);
    },

    saveNote(key, text) {
      if (!loaded) return;
      const before = loaded.notes.get(key);
      updateLoaded((previous) => ({ notes: setNote(previous.notes, key, text) }));
      const write = text.trim() === '' ? libraryApi.deleteNote(key) : libraryApi.saveNote(key, text);
      write.catch(() => updateLoaded((previous) => ({ notes: restored(previous.notes, key, before) })));
    },

    // Une sauvegarde importée (fichier) : dans le compte si on est connecté, sinon dans le navigateur
    importBackup({ highlights, notes }) {
      if (!loaded) {
        setLocalHighlights((previous) => mergeInto(previous, highlights));
        setLocalNotes((previous) => mergeInto(previous, notes));
        return;
      }
      libraryApi.mergeLibrary({ highlights: Object.fromEntries(highlights), notes: Object.fromEntries(notes) })
        .then((library) => setAccountLibrary({ email, ...asMaps(library) }))
        .catch(() => {});
    },
  };
}

// À la connexion (ou à l'ouverture, déjà connecté) : envoie ce qui est dans le navigateur, reçoit la
// bibliothèque du compte, puis vide le navigateur. Serveur injoignable : on reste sur le navigateur.
function useAccountLoading(email, { setAccountLibrary, setLocalNotes, setLocalHighlights }) {
  useEffect(() => {
    if (!email) return;
    let ignore = false;
    const local = { notes: Object.fromEntries(loadNotes()), highlights: Object.fromEntries(loadHighlights()), bookmarks: Object.fromEntries(loadBookmarks()) };
    libraryApi.mergeLibrary(local)
      .then((library) => {
        if (ignore) return;
        setLocalNotes(new Map());
        setLocalHighlights(new Map());
        setAccountLibrary({ email, ...asMaps(library) });
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [email, setAccountLibrary, setLocalNotes, setLocalHighlights]);
}

function asMaps({ notes, highlights, bookmarks }) {
  return { notes: new Map(Object.entries(notes)), highlights: new Map(Object.entries(highlights)), bookmarks: new Map(Object.entries(bookmarks)) };
}

// La note d'avant (ou plus de note) : pour annuler une écriture qui a échoué
function restored(notes, key, before) {
  const next = new Map(notes);
  if (before) next.set(key, before);
  else next.delete(key);
  return next;
}
