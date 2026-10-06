// @vitest-environment jsdom
// Tests du marque-page : l'app retient où on en était (une position par lecture), sans l'écraser
// tant qu'on n'a pas lu, et montre celui de la visite précédente.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useBookmark } from '../../src/frise/useBookmark.js';
import { loadBookmarks } from '../../src/frise/bookmark.storage.js';

const saveStored = (bookmarks) => localStorage.setItem('bookmarks', JSON.stringify({ version: 1, bookmarks }));

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
    saveStored({ history: 12.4, bible: 300 });

    const { result } = renderHook(() => useBookmark('history', null));

    expect(result.current.bookmark).toBe(12.4);
  });

  test('pas de visite précédente : pas de marque-page', () => {
    const { result } = renderHook(() => useBookmark('bible', null));

    expect(result.current.bookmark).toBeNull();
  });

  test('ouvrir l\'app (première position mesurée) n\'écrase pas le marque-page', () => {
    saveStored({ history: 12.4 });

    renderHook(() => useBookmark('history', 1));
    act(() => vi.advanceTimersByTime(5000));

    expect(loadBookmarks().get('history')).toBe(12.4);
  });

  test('une fois qu\'on lit, la nouvelle position est retenue (un peu après, pas à chaque image)', () => {
    saveStored({ history: 12.4, bible: 300 });
    const { rerender } = renderHook(({ readingAt }) => useBookmark('history', readingAt), { initialProps: { readingAt: 1 } });

    rerender({ readingAt: 1.5 });
    expect(loadBookmarks().get('history')).toBe(12.4);
    act(() => vi.advanceTimersByTime(2000));

    expect(loadBookmarks().get('history')).toBe(1.5);
    expect(loadBookmarks().get('bible')).toBe(300);
  });

  test('une fois le marque-page repris, il n\'est plus montré', () => {
    saveStored({ history: 12.4 });
    const { result } = renderHook(() => useBookmark('history', null));

    act(() => result.current.forget());

    expect(result.current.bookmark).toBeNull();
  });
});
