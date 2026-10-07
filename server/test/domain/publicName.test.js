// Tests du prénom montré à d'autres (lien de partage) : nettoyé avant d'être gardé.

import { describe, test, expect } from 'vitest';
import { publicName } from '../../src/domain/publicName.js';

describe('publicName', () => {
  test('un prénom ordinaire reste tel quel (espaces autour retirés)', () => {
    expect(publicName('  Marin ')).toBe('Marin');
    expect(publicName('Jean-Éloi')).toBe('Jean-Éloi');
  });

  test('sans caractères de contrôle, 30 caractères au plus', () => {
    expect(publicName('Ma\nrin\u0007')).toBe('Marin');
    expect(publicName('a'.repeat(50))).toHaveLength(30);
  });

  test('rien d\'utilisable : null', () => {
    expect(publicName('   ')).toBeNull();
    expect(publicName(null)).toBeNull();
    expect(publicName(42)).toBeNull();
  });
});
