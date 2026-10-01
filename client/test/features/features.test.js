// Tests des feature flags : quelle fonctionnalité est visible, en dev et en ligne.
// La règle est une fonction pure : on lui passe la situation au lieu de lire Vite.

import { describe, test, expect } from 'vitest';
import { isFeatureEnabled } from '../../src/features/features.js';

describe('isFeatureEnabled', () => {
  test('en dev, toutes les fonctionnalités sont visibles (pour travailler dessus)', () => {
    expect(isFeatureEnabled('frise', { isDev: true, enabledList: undefined })).toBe(true);
  });

  test('en ligne, une fonctionnalité listée est visible', () => {
    expect(isFeatureEnabled('frise', { isDev: false, enabledList: 'frise' })).toBe(true);
  });

  test('en ligne, une fonctionnalité non listée est cachée', () => {
    expect(isFeatureEnabled('graphe', { isDev: false, enabledList: 'frise' })).toBe(false);
  });

  test('en ligne, sans liste (variable absente ou vide), tout est caché', () => {
    expect(isFeatureEnabled('frise', { isDev: false, enabledList: undefined })).toBe(false);
    expect(isFeatureEnabled('frise', { isDev: false, enabledList: '' })).toBe(false);
  });

  test('plusieurs fonctionnalités séparées par des virgules, espaces ignorés', () => {
    const situation = { isDev: false, enabledList: ' frise , graphe ' };

    expect(isFeatureEnabled('frise', situation)).toBe(true);
    expect(isFeatureEnabled('graphe', situation)).toBe(true);
  });

  test('le nom doit correspondre exactement (pas de morceau de nom)', () => {
    expect(isFeatureEnabled('fri', { isDev: false, enabledList: 'frise' })).toBe(false);
  });
});
