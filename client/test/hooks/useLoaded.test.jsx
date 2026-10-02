// @vitest-environment jsdom
// Tests du hook « charger une valeur » : la valeur de départ, puis celle chargée, ou celle de secours si le
// chargement échoue ; rien n'est chargé sans clé.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { useLoaded } from '../../src/hooks/useLoaded.js';

afterEach(cleanup);

describe('useLoaded', () => {
  test('la valeur de départ, puis la valeur chargée pour cette clé', async () => {
    const load = vi.fn(async (key) => `arbre ${key}`);
    const { result } = renderHook(() => useLoaded('bible', load, 'départ', 'secours'));

    expect(result.current).toBe('départ');
    await waitFor(() => expect(result.current).toBe('arbre bible'));
  });

  test('le chargement échoue : la valeur de secours', async () => {
    const load = vi.fn(async () => { throw new Error('réseau coupé'); });
    const { result } = renderHook(() => useLoaded('bible', load, 'départ', 'secours'));

    await waitFor(() => expect(result.current).toBe('secours'));
  });

  test('pas de clé (null) : rien n\'est chargé, la valeur de départ reste', () => {
    const load = vi.fn();
    const { result } = renderHook(() => useLoaded(null, load, 'départ', 'secours'));

    expect(result.current).toBe('départ');
    expect(load).not.toHaveBeenCalled();
  });
});
