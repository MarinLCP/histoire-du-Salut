// @vitest-environment jsdom
// Tests du hook useLibrary : où vivent notes, surlignages, marque-pages et positions de lecture, avec ou sans
// compte (faux fetch).

import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLibrary } from '../../src/library/useLibrary.js';
import { loadNotes } from '../../src/notes/notes.storage.js';
import { loadHighlights } from '../../src/highlights/highlights.storage.js';
import { loadBookmarks } from '../../src/frise/bookmark.storage.js';
import { loadReadingPositions, saveReadingPosition } from '../../src/frise/readingPositions.storage.js';

const SIGNED_IN = { email: 'marin@exemple.fr' };
const EMPTY = { notes: {}, highlights: {}, bookmarks: {}, readings: {} };
const PLACED = { position: 12.4, verse: 'Gn 12,1' };
const OLD_NOTE = { text: 'Une note d\'avant', updatedAt: '2026-01-01T00:00:00.000Z' };
const store = (key, entries) => localStorage.setItem(key, JSON.stringify({ version: 1, [key]: entries }));
const json = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status });

// Faux serveur : renvoie `library` (lecture ou fusion) ; les écritures réussissent, sauf avec failWrites
function fakeServer(library, { failWrites = false, failLoad = false } = {}) {
  const fetchMock = vi.fn(async (url) => {
    if (url === '/api/me/library') return failLoad ? json({ error: 'Base indisponible.' }, 503) : json(library);
    return failWrites ? json({ error: 'Base indisponible.' }, 503) : json(null, 204);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function signedIn() {
  const hook = renderHook(() => useLibrary(SIGNED_IN));
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook.result;
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('useLibrary', () => {
  test('pas connecté : surlignages dans le navigateur, pas de notes (elles attendent la connexion)', () => {
    store('notes', { 'Gn 1,3': OLD_NOTE });
    const { result } = renderHook(() => useLibrary(null));

    act(() => result.current.toggleHighlight('Gn 1,1'));

    expect(result.current.status).toBe('local');
    expect(result.current.notes.size).toBe(0);
    expect(result.current.waitingNotes.size).toBe(1);
    expect(loadHighlights().has('Gn 1,1')).toBe(true);
  });

  test('connecté : le navigateur rejoint le compte (fusion), puis il est vidé, sauf les positions de lecture', async () => {
    store('notes', { 'Gn 1,3': OLD_NOTE });
    localStorage.setItem('bookmarks', JSON.stringify({ version: 3, bookmarks: { bible: { position: 3, verse: 'Gn 3,1' } } }));
    const reading = saveReadingPosition('history', 5.5);
    const fetchMock = fakeServer({ ...EMPTY, notes: { 'Gn 1,3': OLD_NOTE }, bookmarks: { history: PLACED } });

    const result = await signedIn();

    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(sent.notes)).toEqual(['Gn 1,3']);
    expect(sent.bookmarks).toEqual({ bible: { position: 3, verse: 'Gn 3,1' } });
    expect(sent.readings).toEqual({ history: reading });
    expect(result.current.notes.get('Gn 1,3').text).toBe('Une note d\'avant');
    expect(result.current.bookmarks.saved.get('history')).toEqual(PLACED);
    expect([loadNotes().size, loadHighlights().size, loadBookmarks().size, loadReadingPositions().size]).toEqual([0, 0, 0, 1]);
  });

  test('connecté, rien dans le navigateur : une simple lecture du compte', async () => {
    const fetchMock = fakeServer(EMPTY);

    await signedIn();

    expect(fetchMock).toHaveBeenCalledWith('/api/me/library');
  });

  test('la note mise de côté sans compte rejoint le compte à la connexion', async () => {
    const fetchMock = fakeServer(EMPTY);
    const { result, rerender } = renderHook(({ user }) => useLibrary(user), { initialProps: { user: null } });

    act(() => result.current.holdNote('Jn 3,16', 'Dieu a tant aimé'));
    rerender({ user: SIGNED_IN });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).notes['Jn 3,16'].text).toBe('Dieu a tant aimé');
  });

  test('chargement du compte en échec : status « failed », puis retry réessaie', async () => {
    fakeServer(EMPTY, { failLoad: true });
    const { result } = renderHook(() => useLibrary(SIGNED_IN));
    await waitFor(() => expect(result.current.status).toBe('failed'));

    fakeServer(EMPTY);
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('ready'));
  });

  test('connecté : une note est affichée tout de suite et écrite dans le compte', async () => {
    const fetchMock = fakeServer(EMPTY);
    const result = await signedIn();

    act(() => result.current.saveNote('Jn 3,16', 'Dieu a tant aimé'));

    expect(result.current.notes.get('Jn 3,16').text).toBe('Dieu a tant aimé');
    expect(fetchMock).toHaveBeenCalledWith('/api/me/notes/Jn%203%2C16', expect.objectContaining({ method: 'PUT' }));
  });

  test('une écriture qui échoue est annulée : surlignage retiré, note créée retirée, note modifiée rendue', async () => {
    fakeServer({ notes: { 'Gn 1,3': OLD_NOTE }, highlights: {}, bookmarks: {} }, { failWrites: true });
    const result = await signedIn();

    act(() => {
      result.current.toggleHighlight('Gn 1,1');
      result.current.saveNote('Jn 3,16', 'Nouvelle');
      result.current.saveNote('Gn 1,3', 'Modifiée');
    });
    expect(result.current.notes.get('Gn 1,3').text).toBe('Modifiée');

    await waitFor(() => expect(result.current.highlights.has('Gn 1,1')).toBe(false));
    await waitFor(() => expect(result.current.notes.has('Jn 3,16')).toBe(false));
    await waitFor(() => expect(result.current.notes.get('Gn 1,3').text).toBe('Une note d\'avant'));
  });

  test('connecté : où on en est va sur l\'appareil et dans le compte ; surligner ne change pas les marque-pages', async () => {
    const fetchMock = fakeServer(EMPTY);
    const result = await signedIn();
    const bookmarksBefore = result.current.bookmarks;

    act(() => result.current.toggleHighlight('Gn 1,1'));
    act(() => result.current.readings.save('bible', 300.5));

    expect(result.current.bookmarks).toBe(bookmarksBefore);
    expect(fetchMock).toHaveBeenCalledWith('/api/me/readings/bible', expect.objectContaining({ method: 'PUT', body: '{"position":300.5}' }));
    expect(loadReadingPositions().get('bible').position).toBe(300.5);
  });

  test('où revenir à l\'ouverture : la position la plus récente, de cet appareil ou du compte', async () => {
    localStorage.setItem('readings', JSON.stringify({ version: 1, readings: {
      history: { position: 5, savedAt: '2026-10-09T10:00:00.000Z' },
      bible: { position: 7, savedAt: '2026-10-01T10:00:00.000Z' },
    } }));
    fakeServer({ ...EMPTY, readings: { history: { position: 2, savedAt: '2026-10-01T10:00:00.000Z' }, bible: { position: 300, savedAt: '2026-10-08T10:00:00.000Z' } } });
    const hook = renderHook(() => useLibrary(SIGNED_IN));

    // Le compte se charge : pas encore su
    expect(hook.result.current.readings.latest('history')).toBeUndefined();
    await waitFor(() => expect(hook.result.current.status).toBe('ready'));

    expect(hook.result.current.readings.latest('history')).toBe(5);
    expect(hook.result.current.readings.latest('bible')).toBe(300);
  });

  test('pas connecté : la position de cet appareil, ou aucune', () => {
    saveReadingPosition('history', 5.5);
    const { result } = renderHook(() => useLibrary(null));

    expect(result.current.readings.latest('history')).toBe(5.5);
    expect(result.current.readings.latest('bible')).toBeNull();
  });

  test('pas connecté : poser le marque-page sur un verset se voit tout de suite et reste dans le navigateur', () => {
    localStorage.clear();
    const { result } = renderHook(() => useLibrary(null));

    act(() => result.current.bookmarks.place('history', 'Gn 1,3', 4.2));

    expect(result.current.bookmarks.saved.get('history')).toEqual({ position: 4.2, verse: 'Gn 1,3' });
    expect(loadBookmarks().get('history')).toEqual({ position: 4.2, verse: 'Gn 1,3' });

    act(() => result.current.bookmarks.remove('history'));

    expect(result.current.bookmarks.saved.has('history')).toBe(false);
    expect(loadBookmarks().has('history')).toBe(false);
  });

  test('connecté : poser le marque-page l\'écrit dans le compte ; si l\'écriture échoue, il revient où il était', async () => {
    const before = { position: 9, verse: 'Ps 1,1' };
    const fetchMock = fakeServer({ ...EMPTY, bookmarks: { bible: before } }, { failWrites: true });
    const result = await signedIn();

    act(() => result.current.bookmarks.place('bible', 'Ps 22,1', 30.5));

    expect(result.current.bookmarks.saved.get('bible')).toEqual({ position: 30.5, verse: 'Ps 22,1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/me/bookmarks/bible',
      expect.objectContaining({ method: 'PUT', body: '{"position":30.5,"verse":"Ps 22,1"}' }));
    await waitFor(() => expect(result.current.bookmarks.saved.get('bible')).toEqual(before));
  });
});
