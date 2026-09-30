// @vitest-environment jsdom
// Tests du menu d'un verset, manipulé comme par un utilisateur (React Testing Library).
// La ligne du dessus fait tourner ce fichier dans un faux navigateur (jsdom).

import { describe, test, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerseMenu from '../src/components/VerseMenu.jsx';

// jsdom connaît <dialog> mais pas sa méthode showModal : on la remplace par une version minimale
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
});

afterEach(cleanup);

function renderMenu(props = {}) {
  const handlers = {
    onToggleHighlight: vi.fn(),
    onSaveNote: vi.fn(),
    onClose: vi.fn(),
    // Faux presse-papiers : la copie réussit (le vrai n'existe pas dans jsdom)
    onCopy: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <VerseMenu
      verseKey="Gn 1,3"
      verseText="Et la lumière fut."
      isHighlighted={false}
      note={undefined}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('VerseMenu', () => {
  test('affiche la référence du verset', () => {
    renderMenu();

    expect(screen.getByRole('heading', { name: 'Gn 1,3' })).toBeDefined();
  });

  test('"Surligner" surligne le verset puis ferme le menu', async () => {
    const { onToggleHighlight, onClose } = renderMenu();

    await userEvent.click(screen.getByRole('button', { name: 'Surligner' }));

    expect(onToggleHighlight).toHaveBeenCalledWith('Gn 1,3');
    expect(onClose).toHaveBeenCalled();
  });

  test('un verset déjà surligné propose de retirer le surlignage', () => {
    renderMenu({ isHighlighted: true });

    expect(screen.getByRole('button', { name: 'Retirer le surlignage' })).toBeDefined();
  });

  test('écrire une note puis "Enregistrer" sauvegarde le texte et ferme le menu', async () => {
    const { onSaveNote, onClose } = renderMenu();

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une note' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Ma note' }), 'La lumière avant le soleil');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onSaveNote).toHaveBeenCalledWith('Gn 1,3', 'La lumière avant le soleil');
    expect(onClose).toHaveBeenCalled();
  });

  test('une note existante est pré-remplie et peut être supprimée', async () => {
    const note = { text: 'Ancienne note', updatedAt: '2026-09-30T10:00:00.000Z' };
    const { onSaveNote } = renderMenu({ note });

    await userEvent.click(screen.getByRole('button', { name: 'Modifier la note' }));
    expect(screen.getByRole('textbox', { name: 'Ma note' }).value).toBe('Ancienne note');

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer la note' }));
    expect(onSaveNote).toHaveBeenCalledWith('Gn 1,3', '');
  });

  test('sans note existante, pas de bouton "Supprimer la note"', async () => {
    renderMenu();

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une note' }));

    expect(screen.queryByRole('button', { name: 'Supprimer la note' })).toBeNull();
  });

  describe('copier le verset', () => {
    test('copie le verset avec sa référence, et le confirme', async () => {
      const { onCopy } = renderMenu();

      await userEvent.click(screen.getByRole('button', { name: 'Copier le verset' }));

      expect(onCopy).toHaveBeenCalledWith('«\u00a0Et la lumière fut.\u00a0» (Gn 1,3)');
      expect(await screen.findByRole('button', { name: 'Verset copié ✓' })).toBeDefined();
    });

    test('si la copie échoue, le dit au lieu de faire comme si de rien n\'était', async () => {
      renderMenu({ onCopy: vi.fn().mockRejectedValue(new Error('refusé')) });

      await userEvent.click(screen.getByRole('button', { name: 'Copier le verset' }));

      expect(await screen.findByRole('button', { name: 'Copie impossible' })).toBeDefined();
    });
  });

  describe('fermeture en touchant le fond grisé', () => {
    test('un appui qui commence et finit sur le fond ferme le menu', () => {
      const { onClose } = renderMenu();
      const backdrop = document.querySelector('dialog');

      fireEvent.pointerDown(backdrop);
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalled();
    });

    test('le doigt qui se lève à la fin de l\'appui long ne referme PAS le menu', () => {
      const { onClose } = renderMenu();
      const backdrop = document.querySelector('dialog');

      // L'appui a commencé sur le verset, avant que le menu n'existe :
      // le menu ne reçoit que la fin (le clic), pas le début
      fireEvent.click(backdrop);

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
