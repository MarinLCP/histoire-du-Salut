// @vitest-environment jsdom
// Tests du bouton qui confirme son action (utilisé par "Copier le verset" et "Partager").

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import StatusButton from '../../src/components/StatusButton.jsx';

const labels = { idle: 'Copier', done: 'Copié ✓', failed: 'Échec' };

afterEach(cleanup);

describe('StatusButton', () => {
  test('affiche le libellé "done" quand l\'action réussit', async () => {
    render(<StatusButton labels={labels} action={vi.fn().mockResolvedValue('done')} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copier' }));

    expect(await screen.findByRole('button', { name: 'Copié ✓' })).toBeDefined();
  });

  test('affiche le libellé "failed" quand l\'action échoue', async () => {
    render(<StatusButton labels={labels} action={vi.fn().mockRejectedValue(new Error('refusé'))} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copier' }));

    expect(await screen.findByRole('button', { name: 'Échec' })).toBeDefined();
  });

  test('un statut inattendu garde le libellé de départ (jamais un bouton vide)', async () => {
    const action = vi.fn().mockResolvedValue('statut-inconnu');
    render(<StatusButton labels={labels} action={action} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copier' }));

    await vi.waitFor(() => expect(action).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Copier' })).toBeDefined();
  });
});
