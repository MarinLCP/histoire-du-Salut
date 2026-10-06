// @vitest-environment jsdom
// Tests du hook useLibrary : où vivent notes, surlignages et marque-pages, avec ou sans compte (faux fetch).

import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLibrary } from '../../src/library/useLibrary.js';
import { loadNotes } from '../../src/notes/notes.storage.js';
import { loadHighlights } from '../../src/highlights/highlights.storage.js';

const SIGNED_IN = { email: 'marin@exemple.fr' };
const store = (key, entries) => localStorage.setItem(key, JSON.stringify({ version: 1, [key]: entries }));
const json = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status });

// Faux serveur : renvoie `library` à la fusion ; les écritures réussissent (ou échouent si failWrites)
function fakeServer(library, { failWrites = false } = {}) {
  const fetchMock = vi.fn(async (url, options) => {
    if (url === '/api/me/library') return json(library);
    return failWrites ? json({ error: 'Base indisponible.' }, 503) : json(null, 204);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('useLibrary', () => {
  test('pas connecté : surlignages dans le navigateur, pas de notes (elles attendent la connexion)', () => {
    store('notes', { 'Gn 1,3': { text: 'Une note d\'avant', updatedAt: '2026-01-01T00:00:00.000Z' } });
    const { result } = renderHook(() => useLibrary(null));

    act(() => result.current.toggleHighlight('Gn 1,1'));

    expect(result.current.canSaveNotes).toBe(false);
    expect(result.current.notes.size).toBe(0);
    expect(result.current.waitingNotes.size).toBe(1);
    expect(loadHighlights().has('Gn 1,1')).toBe(true);
  });

  test('connecté : le navigateur rejoint le compte, puis il est vidé', async () => {
    store('notes', { 'Gn 1,3': { text: 'Une note d\'avant', updatedAt: '2026-01-01T00:00:00.000Z' } });
    store('highlights', { 'Gn 1,1': { createdAt: '2026-01-01T00:00:00.000Z' } });
    const fetchMock = fakeServer({
      notes: { 'Gn 1,3': { text: 'Une note d\'avant', updatedAt: '2026-01-01T00:00:00.000Z' } },
      highlights: { 'Gn 1,1': { createdAt: '2026-01-01T00:00:00.000Z' } },
      bookmarks: { history: 12.4 },
    });

    const { result } = renderHook(() => useLibrary(SIGNED_IN));
    await waitFor(() => expect(result.current.canSaveNotes).toBe(true));

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(sent.notes)).toEqual(['Gn 1,3']);
    expect(result.current.notes.get('Gn 1,3').text).toBe('Une note d\'avant');
    expect(result.current.bookmarks.saved.get('history')).toBe(12.4);
    expect(loadNotes().size).toBe(0);
    expect(loadHighlights().size).toBe(0);
  });

  test('connecté : une note est affichée tout de suite et écrite dans le compte', async () => {
    const fetchMock = fakeServer({ notes: {}, highlights: {}, bookmarks: {} });
    const { result } = renderHook(() => useLibrary(SIGNED_IN));
    await waitFor(() => expect(result.current.canSaveNotes).toBe(true));

    act(() => result.current.saveNote('Jn 3,16', 'Dieu a tant aimé'));

    expect(result.current.notes.get('Jn 3,16').text).toBe('Dieu a tant aimé');
    expect(fetchMock).toHaveBeenCalledWith('/api/me/notes/Jn%203%2C16', expect.objectContaining({ method: 'PUT' }));
  });

  test('connecté : une écriture qui échoue est annulée à l\'écran', async () => {
    fakeServer({ notes: {}, highlights: {}, bookmarks: {} }, { failWrites: true });
    const { result } = renderHook(() => useLibrary(SIGNED_IN));
    await waitFor(() => expect(result.current.canSaveNotes).toBe(true));

    act(() => result.current.toggleHighlight('Gn 1,1'));
    expect(result.current.highlights.has('Gn 1,1')).toBe(true);

    await waitFor(() => expect(result.current.highlights.has('Gn 1,1')).toBe(false));
  });

  test('connecté : le marque-page est retenu dans le navigateur ET dans le compte', async () => {
    const fetchMock = fakeServer({ notes: {}, highlights: {}, bookmarks: {} });
    const { result } = renderHook(() => useLibrary(SIGNED_IN));
    await waitFor(() => expect(result.current.canSaveNotes).toBe(true));

    act(() => result.current.bookmarks.save('bible', 300.5));

    expect(JSON.parse(localStorage.getItem('bookmarks')).bookmarks.bible).toBe(300.5);
    expect(fetchMock).toHaveBeenCalledWith('/api/me/bookmarks/bible', expect.objectContaining({ body: '{"position":300.5}' }));
  });
});
