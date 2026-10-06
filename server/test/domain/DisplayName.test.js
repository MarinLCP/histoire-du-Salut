// Tests unitaires du value object DisplayName (le pseudo affiché sur un lien de partage).

import { describe, test, expect } from 'vitest';
import { DisplayName } from '../../src/domain/DisplayName.js';
import { ValidationError } from '../../src/domain/errors.js';

describe('DisplayName', () => {
  test('sans espaces autour', () => {
    expect(new DisplayName('  Marin ').value).toBe('Marin');
  });

  test.each(['M', 'a'.repeat(31), '   ', 'Ma\nrin', '<b>Marin</b>', undefined, 42])('refuse %j', (text) => {
    expect(() => new DisplayName(text)).toThrow(ValidationError);
  });

  test('est immuable', () => {
    expect(Object.isFrozen(new DisplayName('Marin'))).toBe(true);
  });
});
