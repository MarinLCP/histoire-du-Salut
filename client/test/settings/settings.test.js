// Tests des réglages de lecture (fonctions pures) : valeurs reconnues, et leur application à la page.

import { describe, test, expect } from 'vitest';
import { DEFAULT_SETTINGS, withDefaults, applySettings } from '../../src/settings/settings.js';

// Un faux élément racine : on lit ce que applySettings y a écrit
function fakeRoot() {
  const attributes = new Map();
  const styles = new Map();
  return {
    attributes,
    styles,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    style: { setProperty: (name, value) => styles.set(name, value) },
  };
}

describe('withDefaults', () => {
  test('rien d\'enregistré : les réglages par défaut (texte normal, thème automatique)', () => {
    expect(withDefaults({})).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({ textSize: 'normal', theme: 'auto' });
  });

  test('garde les valeurs reconnues, remplace les inconnues par celles par défaut', () => {
    expect(withDefaults({ textSize: 'large', theme: 'violet' })).toEqual({ textSize: 'large', theme: 'auto' });
  });
});

describe('applySettings', () => {
  test('la taille du texte devient une échelle CSS (--reading-scale)', () => {
    const root = fakeRoot();

    applySettings({ textSize: 'large', theme: 'auto' }, root);

    expect(Number(root.styles.get('--reading-scale'))).toBeGreaterThan(1);
  });

  test('un thème choisi est posé sur la racine (data-theme) ; « automatique » suit le téléphone ou l\'ordinateur', () => {
    const root = fakeRoot();

    applySettings({ textSize: 'normal', theme: 'dark' }, root);
    expect(root.attributes.get('data-theme')).toBe('dark');

    applySettings({ textSize: 'normal', theme: 'auto' }, root);
    expect(root.attributes.has('data-theme')).toBe(false);
  });
});
