// @vitest-environment jsdom
// Tests de la mémoire de lecture : la position est retenue pendant la lecture (pas tant qu'on n'a pas bougé),
// et à l'ouverture, la lecture y revient, une fois, sauf si on arrive par un lien ou par « Revenir à … ».

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useReadingMemory } from '../../src/frise/useReadingMemory.js';
import { ReadingPositionsContext } from '../../src/library/ReadingPositionsContext.js';

// La mémoire, branchée sur une fausse bibliothèque : latest donne `target` (12.4 s'il n'est pas donné ;
// undefined : pas encore su), save est espionné
function renderMemory({ entry = '/', readingAt = null, resumed = new Set(), ...options } = {}) {
  const target = 'target' in options ? options.target : 12.4;
  const save = vi.fn();
  const onJump = vi.fn();
  const positions = { latest: () => target, save, resumed };
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[entry]}>
      <ReadingPositionsContext.Provider value={positions}>{children}</ReadingPositionsContext.Provider>
    </MemoryRouter>
  );
  const hook = renderHook((props) => useReadingMemory('history', props.readingAt, onJump), { wrapper, initialProps: { readingAt } });
  return { ...hook, save, onJump, positions };
}

describe('useReadingMemory', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test('à l\'ouverture, la lecture revient où on en était, une seule fois', () => {
    const { onJump, rerender } = renderMemory();

    rerender({ readingAt: 12.4 });
    rerender({ readingAt: 1 });

    expect(onJump).toHaveBeenCalledTimes(1);
    expect(onJump).toHaveBeenCalledWith(12.4);
  });

  test('déjà reprise depuis l\'ouverture (ex. revenir sur la page) : on n\'y retourne pas', () => {
    const { onJump } = renderMemory({ resumed: new Set(['history']) });

    expect(onJump).not.toHaveBeenCalled();
  });

  test.each([
    ['un lien partagé', '/?passage=chute'],
    ['« Revenir à … »', { pathname: '/', state: { scrollToVerse: 'Gn 3,15' } }],
  ])('arrivée par %s : on va où le lien mène, pas à la position retenue', (_, entry) => {
    const { onJump, positions } = renderMemory({ entry });

    expect(onJump).not.toHaveBeenCalled();
    // Et plus tard dans la même ouverture non plus
    expect(positions.resumed.has('history')).toBe(true);
  });

  test('rien de retenu : la lecture commence au début', () => {
    const { onJump } = renderMemory({ target: null });

    expect(onJump).not.toHaveBeenCalled();
  });

  test('le compte se charge (position pas encore sue) : on attend, puis on y va', () => {
    const { onJump, rerender, positions } = renderMemory({ target: undefined, readingAt: 0.2 });
    expect(onJump).not.toHaveBeenCalled();

    positions.latest = () => 12.4;
    rerender({ readingAt: 0.2 });

    expect(onJump).toHaveBeenCalledWith(12.4);
  });

  test('le compte se charge, et le lecteur a bougé entre-temps : on le laisse où il est', () => {
    const { onJump, rerender, positions } = renderMemory({ target: undefined, readingAt: 0.2 });
    rerender({ readingAt: 3.5 });

    positions.latest = () => 12.4;
    rerender({ readingAt: 3.6 });

    expect(onJump).not.toHaveBeenCalled();
  });

  test('ouvrir (première position mesurée) n\'écrase pas la position retenue ; une fois qu\'on lit, elle l\'est', () => {
    const { save, rerender } = renderMemory({ readingAt: 0.2 });
    act(() => vi.advanceTimersByTime(5000));
    expect(save).not.toHaveBeenCalled();

    rerender({ readingAt: 1.5 });
    expect(save).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2000));

    expect(save).toHaveBeenCalledWith('history', 1.5);
  });
});
