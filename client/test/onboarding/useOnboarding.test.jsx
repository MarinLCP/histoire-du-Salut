// @vitest-environment jsdom
// Tests de la présentation du site : les cartes à la première visite, puis l'astuce, chacune une seule fois
// (souvenir dans le navigateur), et « Revoir la présentation ».

import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from '../../src/onboarding/useOnboarding.js';

describe('useOnboarding', () => {
  // test/setup.js marque la présentation « déjà vue » : ici, on part d'une première visite
  beforeEach(() => localStorage.removeItem('onboarding'));

  test('première visite : les cartes s\'ouvrent ; l\'astuce attend qu\'elles soient refermées', () => {
    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isWelcomeOpen).toBe(true);
    expect(result.current.isHintVisible).toBe(false);

    act(() => result.current.closeWelcome());

    expect(result.current.isWelcomeOpen).toBe(false);
    expect(result.current.isHintVisible).toBe(true);
  });

  test('chacune une seule fois : à la visite suivante, ni cartes ni astuce', () => {
    const first = renderHook(() => useOnboarding());
    act(() => first.result.current.closeWelcome());
    act(() => first.result.current.dismissHint());

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isWelcomeOpen).toBe(false);
    expect(result.current.isHintVisible).toBe(false);
  });

  test('« Revoir la présentation » rouvre les cartes', () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.closeWelcome());

    act(() => result.current.openWelcome());

    expect(result.current.isWelcomeOpen).toBe(true);
  });
});
