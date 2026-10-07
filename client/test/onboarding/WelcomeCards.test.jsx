// @vitest-environment jsdom
// Tests des cartes d'accueil : passer d'une carte à l'autre (boutons, clavier), Passer, Commencer.

import { describe, test, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import WelcomeCards from '../../src/onboarding/WelcomeCards.jsx';

// jsdom connaît <dialog> mais pas sa méthode showModal : on la remplace par une version minimale
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
});

afterEach(cleanup);

function renderCards() {
  const onClose = vi.fn();
  render(<WelcomeCards onClose={onClose} />);
  return { onClose };
}

const title = () => screen.getByRole('heading', { level: 2 }).textContent;

describe('WelcomeCards', () => {
  test('trois cartes : Bienvenue (les deux lectures), la frise, les notes ; « Commencer » sur la dernière', () => {
    const { onClose } = renderCards();

    expect(title()).toBe('Bienvenue');
    expect(screen.getByText('Bible entière', { selector: 'strong' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(title()).toBe('La frise, ta carte');
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(title()).toBe('Tes notes et surlignages');
    expect(screen.queryByRole('button', { name: 'Passer' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Commencer' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('« Passer » referme les cartes dès la première', () => {
    const { onClose } = renderCards();

    fireEvent.click(screen.getByRole('button', { name: 'Passer' }));

    expect(onClose).toHaveBeenCalled();
  });

  test('au clavier, les flèches passent d\'une carte à l\'autre (sans dépasser la première)', () => {
    renderCards();
    const dialog = screen.getByRole('dialog');

    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    expect(title()).toBe('Bienvenue');
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(title()).toBe('La frise, ta carte');
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    expect(title()).toBe('Bienvenue');
  });

  test('les points disent où on en est', () => {
    renderCards();

    expect(screen.getByRole('img', { name: 'Carte 1 sur 3' })).toBeDefined();
  });
});
