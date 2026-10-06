// @vitest-environment jsdom
// Tests du hook useAccount : qui est connecté à l'ouverture, puis connexion et déconnexion (faux fetch).

import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAccount } from '../../src/account/useAccount.js';

const json = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status });

afterEach(() => vi.unstubAllGlobals());

describe('useAccount', () => {
  test('à l\'ouverture : on ne sait pas encore (undefined), puis le lecteur connecté', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ user: { email: 'marin@exemple.fr' } })));
    const { result } = renderHook(() => useAccount());

    expect(result.current.user).toBeUndefined();
    await waitFor(() => expect(result.current.user).toEqual({ email: 'marin@exemple.fr' }));
  });

  test('serveur injoignable : comme personne de connecté', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const { result } = renderHook(() => useAccount());

    await waitFor(() => expect(result.current.user).toBeNull());
  });

  test('se connecter, puis se déconnecter', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, options) => {
      if (options?.method === 'POST') return json({ user: { email: 'marin@exemple.fr' } });
      if (options?.method === 'DELETE') return json(null, 204);
      return json({ user: null });
    }));
    const { result } = renderHook(() => useAccount());
    await waitFor(() => expect(result.current.user).toBeNull());

    await act(() => result.current.logIn({ email: 'marin@exemple.fr', password: 'un mot de passe long' }));
    expect(result.current.user).toEqual({ email: 'marin@exemple.fr' });
    expect(fetch).toHaveBeenCalledWith('/api/session', expect.objectContaining({ method: 'POST' }));

    await act(() => result.current.logOut());
    expect(result.current.user).toBeNull();
  });

  test('un échec rejette avec le message du serveur, et rien ne change', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, options) => (options?.method === 'POST'
      ? json({ error: 'E-mail ou mot de passe incorrect.' }, 401)
      : json({ user: null }))));
    const { result } = renderHook(() => useAccount());
    await waitFor(() => expect(result.current.user).toBeNull());

    await expect(result.current.logIn({ email: 'x@y.fr', password: 'faux' })).rejects.toThrow('E-mail ou mot de passe incorrect.');
    expect(result.current.user).toBeNull();
  });
});
