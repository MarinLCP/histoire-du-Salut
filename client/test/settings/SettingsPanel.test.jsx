// @vitest-environment jsdom
// Tests du panneau Paramètres : choisir la taille du texte et le thème, refermer le panneau, le lien vers la
// page « Confidentialité ».

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SettingsPanel from '../../src/settings/SettingsPanel.jsx';

describe('SettingsPanel', () => {
  beforeEach(() => {
    // jsdom ne connaît pas showModal / close de <dialog>
    HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
    HTMLDialogElement.prototype.close = function close() { this.open = false; };
  });

  afterEach(cleanup);

  const renderPanel = (settings = { textSize: 'normal', theme: 'auto' }) => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    // MemoryRouter : le lien vers la page « Confidentialité » a besoin d'un routeur
    render(<MemoryRouter><SettingsPanel settings={settings} onChange={onChange} onClose={onClose} /></MemoryRouter>);
    return { onChange, onClose };
  };

  test('en bas : le lien vers « Confidentialité et mentions légales », qui referme le panneau', () => {
    const { onClose } = renderPanel();
    const link = screen.getByRole('link', { name: 'Confidentialité et mentions légales' });

    expect(link.getAttribute('href')).toBe('/confidentialite');
    fireEvent.click(link);
    expect(onClose).toHaveBeenCalled();
  });

  test('montre les réglages actuels', () => {
    renderPanel({ textSize: 'large', theme: 'dark' });

    expect(screen.getByRole('radio', { name: 'Grande' }).checked).toBe(true);
    expect(screen.getByRole('radio', { name: 'Sombre' }).checked).toBe(true);
  });

  test('choisir une taille de texte ou un thème change le réglage', () => {
    const { onChange } = renderPanel();

    fireEvent.click(screen.getByRole('radio', { name: 'Petite' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Clair' }));

    expect(onChange).toHaveBeenCalledWith({ textSize: 'small' });
    expect(onChange).toHaveBeenCalledWith({ theme: 'light' });
  });

  test('le bouton Fermer referme le panneau', () => {
    const { onClose } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalled();
  });
});
