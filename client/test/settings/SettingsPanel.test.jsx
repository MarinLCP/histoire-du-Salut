// @vitest-environment jsdom
// Tests du panneau Paramètres : choisir la taille du texte et le thème, refermer le panneau.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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
    render(<SettingsPanel settings={settings} onChange={onChange} onClose={onClose} />);
    return { onChange, onClose };
  };

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
