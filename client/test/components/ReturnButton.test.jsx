// @vitest-environment jsdom
// Tests du bouton « Revenir à … » : visible seulement après un clic sur un parallèle (location.state.returnTo),
// il ramène à la lecture de départ, en demandant d'aller au verset (state.scrollToVerse).

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
    renderAt({ pathname: '/bible', search: '?livre=Jr&chapitre=14&verset=7', state: { returnTo: { key: 'Ps 78,9', href: '/?passage=chute' } } });

    fireEvent.click(screen.getByRole('button', { name: 'Revenir à Ps 78,9' }));

    expect(screen.getByTestId('where').textContent).toBe('/?passage=chute {"scrollToVerse":"Ps 78,9"}');
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
