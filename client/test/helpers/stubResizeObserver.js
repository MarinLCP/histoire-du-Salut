// Faux ResizeObserver pour les tests : jsdom ne calcule aucune taille, ce faux annonce tout de suite
// une zone de width × height px (la frise a besoin d'une taille pour dessiner son escalier).

import { vi } from 'vitest';

export function stubResizeObserver(width, height) {
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width, height } }]); }
    disconnect() {}
  });
}
