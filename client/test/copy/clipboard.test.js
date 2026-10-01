// @vitest-environment jsdom
// Tests de la copie dans le presse-papiers : l'API moderne (HTTPS) et la méthode de secours
// (ex. téléphone en dev sur http://10.x.x.x). Le presse-papiers du navigateur est remplacé par des faux.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyText } from '../../src/copy/clipboard.js';

// Simule une page en HTTPS (contexte "sécurisé") ou non, avec ou sans l'API moderne
function simulateBrowser({ isSecure, clipboard }) {
  Object.defineProperty(window, 'isSecureContext', { value: isSecure, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
}

describe('copyText', () => {
  beforeEach(() => {
    // jsdom ne sait pas copier : execCommand('copy') est remplacé par un faux qui réussit
    document.execCommand = vi.fn(() => true);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  test('en HTTPS : utilise le presse-papiers moderne', async () => {
    const writeText = vi.fn().mockResolvedValue();
    simulateBrowser({ isSecure: true, clipboard: { writeText } });

    await copyText('Et la lumière fut.');

    expect(writeText).toHaveBeenCalledWith('Et la lumière fut.');
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  test('hors HTTPS : copie par la méthode de secours, sans laisser de trace dans la page', async () => {
    simulateBrowser({ isSecure: false, clipboard: undefined });
    let selectedText;
    document.execCommand = vi.fn(() => {
      selectedText = document.querySelector('textarea').value;
      return true;
    });

    await copyText('Et la lumière fut.');

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(selectedText).toBe('Et la lumière fut.');
    expect(document.querySelector('textarea')).toBeNull();
  });

  test('hors HTTPS avec le menu ouvert : la zone de texte est placée DANS le <dialog>', async () => {
    simulateBrowser({ isSecure: false, clipboard: undefined });
    document.body.innerHTML = '<dialog open></dialog>';
    let isInsideDialog;
    document.execCommand = vi.fn(() => {
      isInsideDialog = document.querySelector('dialog[open] textarea') !== null;
      return true;
    });

    await copyText('Et la lumière fut.');

    expect(isInsideDialog).toBe(true);
  });

  test('si le navigateur refuse de copier, la promesse échoue (le bouton affiche "Copie impossible")', async () => {
    simulateBrowser({ isSecure: false, clipboard: undefined });
    document.execCommand = vi.fn(() => false);

    await expect(copyText('Et la lumière fut.')).rejects.toThrow('Copie impossible');
  });
});
