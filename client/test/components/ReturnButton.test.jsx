// @vitest-environment jsdom
// Tests du bouton « Revenir à … » : visible seulement après un clic sur un parallèle (location.state.returnStack),
// il ramène à la lecture de départ, en demandant d'aller au verset (state.scrollToVerse) ; après plusieurs
// parallèles de suite, il revient pas à pas jusqu'à la première lecture.

import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import ReturnButton from '../../src/components/ReturnButton.jsx';
import { returnPoint } from '../../src/bible/returnPoint.js';

// Montre l'adresse et l'état de navigation actuels, pour vérifier où le bouton mène
function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search} ${JSON.stringify(location.state)}`}</p>;
}

const FALL = { key: 'Ps 78,9', href: '/?passage=chute' };
const JEREMIAH = { key: 'Jr 14,7', href: '/bible?livre=Jr&chapitre=14&verset=7' };
const MATTHEW = { key: 'Mt 1,1', href: '/bible?livre=Mt&chapitre=1&verset=1' };

function renderAt(entry) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <ReturnButton />
      <Routes><Route path="*" element={<Where />} /></Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('ReturnButton', () => {
  test('rien à revenir : pas de bouton', () => {
    renderAt('/bible');

    expect(screen.queryByRole('button')).toBeNull();
  });

  test('après un parallèle : « Revenir à Ps 78,9 » ramène au verset de départ', () => {
    renderAt({ pathname: '/bible', search: '?livre=Jr&chapitre=14&verset=7', state: { returnStack: [FALL] } });

    fireEvent.click(screen.getByRole('button', { name: 'Revenir à Ps 78,9' }));

    expect(screen.getByTestId('where').textContent).toBe('/?passage=chute {"scrollToVerse":"Ps 78,9","returnStack":[]}');
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('la croix : rester ici, la pastille disparaît (sans changer de page)', () => {
    renderAt({ pathname: '/bible', search: '?livre=Jr&chapitre=14&verset=7', state: { returnStack: [FALL, JEREMIAH] } });

    fireEvent.click(screen.getByRole('button', { name: 'Rester ici' }));

    expect(screen.queryByRole('button', { name: /Revenir à/ })).toBeNull();
    expect(screen.getByTestId('where').textContent).toContain('/bible?livre=Jr&chapitre=14&verset=7');
  });

  test('trois parallèles de suite : on revient pas à pas jusqu\'à la toute première lecture', () => {
    const stack = [FALL, JEREMIAH, MATTHEW];
    renderAt({ pathname: '/bible', search: '?livre=Lc&chapitre=1&verset=1', state: { returnStack: stack } });

    fireEvent.click(screen.getByRole('button', { name: 'Revenir à Mt 1,1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Revenir à Jr 14,7' }));
    fireEvent.click(screen.getByRole('button', { name: 'Revenir à Ps 78,9' }));

    expect(screen.getByTestId('where').textContent).toBe('/?passage=chute {"scrollToVerse":"Ps 78,9","returnStack":[]}');
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('returnPoint', () => {
  test('la Bible entière au verset ; ou la lecture donnée (un épisode)', () => {
    const reference = { book: 'Ps', chapter: '78', verse: '9' };

    expect(returnPoint('Ps 78,9', reference)).toEqual({ key: 'Ps 78,9', href: '/bible?livre=Ps&chapitre=78&verset=9' });
    expect(returnPoint('Ps 78,9', reference, '/?passage=chute')).toEqual({ key: 'Ps 78,9', href: '/?passage=chute' });
  });

});
