// @vitest-environment jsdom
// Tests du marque-page : l'app retient où on en était (une position par lecture), sans l'écraser
// tant qu'on n'a pas lu, et montre celui de la visite précédente. Posé à la main, il ne bouge plus.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useBookmark } from '../../src/frise/useBookmark.js';
import { loadBookmarks } from '../../src/frise/bookmark.storage.js';

const saveStored = (bookmarks) => localStorage.setItem('bookmarks', JSON.stringify({ version: 2, bookmarks }));
// Un marque-page qui suit la lecture
const at = (position) => ({ position, verse: null });

describe('useBookmark', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test('renvoie le marque-page de la visite précédente, pour cette lecture', () => {
    saveStored({ history: at(12.4), bible: at(300) });

    const { result } = renderHook(() => useBookmark('history', null));

    expect(result.current.bookmark).toBe(12.4);
  });

  test('l\'ancien format du navigateur (une position seule) est relu', () => {
    localStorage.setItem('bookmarks', JSON.stringify({ version: 1, bookmarks: { history: 12.4 } }));

    const { result } = renderHook(() => useBookmark('history', null));

    expect(result.current.bookmark).toBe(12.4);
  });

  test('pas de visite précédente : pas de marque-page', () => {
    const { result } = renderHook(() => useBookmark('bible', null));

    expect(result.current.bookmark).toBeNull();
  });

  test('ouvrir l\'app (première position mesurée) n\'écrase pas le marque-page', () => {
    saveStored({ history: at(12.4) });

    renderHook(() => useBookmark('history', 1));
    act(() => vi.advanceTimersByTime(5000));

    expect(loadBookmarks().get('history')).toEqual(at(12.4));
  });

  test('une fois qu\'on lit, la nouvelle position est retenue (un peu après, pas à chaque image)', () => {
    saveStored({ history: at(12.4), bible: at(300) });
    const { rerender } = renderHook(({ readingAt }) => useBookmark('history', readingAt), { initialProps: { readingAt: 1 } });

    rerender({ readingAt: 1.5 });
    expect(loadBookmarks().get('history')).toEqual(at(12.4));
    act(() => vi.advanceTimersByTime(2000));

    expect(loadBookmarks().get('history')).toEqual(at(1.5));
    expect(loadBookmarks().get('bible')).toEqual(at(300));
  });

  test('posé à la main, il ne bouge plus avec la lecture, et reste montré même une fois repris', () => {
    const placed = { position: 4.2, verse: 'Gn 1,3' };
    saveStored({ history: placed });
    const { result, rerender } = renderHook(({ readingAt }) => useBookmark('history', readingAt), { initialProps: { readingAt: 1 } });

    rerender({ readingAt: 7 });
    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.forget());

    expect(loadBookmarks().get('history')).toEqual(placed);
    expect(result.current.bookmark).toBe(4.2);
  });

  test('une fois le marque-page repris, il n\'est plus montré', () => {
    saveStored({ history: at(12.4) });
    const { result } = renderHook(() => useBookmark('history', null));

    act(() => result.current.forget());

    expect(result.current.bookmark).toBeNull();
  });
});
