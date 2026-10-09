// @vitest-environment jsdom
// Tests du marque-page posé à la main (sans App : celui du navigateur) : sa position, pour cette lecture ; il ne
// bouge pas avec la lecture. Ceux de l'ancien format qui suivaient la lecture ne sont plus des marque-pages.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useBookmark } from '../../src/frise/useBookmark.js';

const PLACED = { position: 4.2, verse: 'Gn 1,3' };
const stored = (version, bookmarks) => localStorage.setItem('bookmarks', JSON.stringify({ version, bookmarks }));

describe('useBookmark', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  test('la position du marque-page posé dans cette lecture', () => {
    stored(3, { history: PLACED, bible: { position: 300, verse: 'Ps 22,1' } });

    expect(renderHook(() => useBookmark('history')).result.current).toBe(4.2);
  });

  test('pas de marque-page posé : null', () => {
    expect(renderHook(() => useBookmark('bible')).result.current).toBeNull();
  });

  test('ancien format (version 2) : le marque-page posé est relu ; celui qui suivait la lecture n\'en est plus un', () => {
    stored(2, { history: PLACED, bible: { position: 300, verse: null } });

    expect(renderHook(() => useBookmark('history')).result.current).toBe(4.2);
    expect(renderHook(() => useBookmark('bible')).result.current).toBeNull();
  });
});
