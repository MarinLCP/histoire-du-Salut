// Tests unitaires du value object Email (domaine pur : ni Express, ni base).

import { describe, test, expect } from 'vitest';
import { Email } from '../../src/domain/Email.js';
import { ValidationError } from '../../src/domain/errors.js';

describe('Email', () => {
  test('rangé en minuscules et sans espaces autour : un même lecteur, une même adresse', () => {
    expect(new Email('  Marin@Exemple.FR ').value).toBe('marin@exemple.fr');
  });

  test.each(['marin', 'marin@', '@exemple.fr', 'marin@exemple', 'ma rin@exemple.fr', '', undefined, 42])(
    'refuse l\'adresse mal formée %j',
    (text) => {
      expect(() => new Email(text)).toThrow(ValidationError);
    },
  );

  test('refuse une adresse trop longue (plus de 254 caractères)', () => {
    expect(() => new Email(`${'a'.repeat(250)}@exemple.fr`)).toThrow('Adresse e-mail invalide.');
  });

  test('est immuable', () => {
    expect(Object.isFrozen(new Email('marin@exemple.fr'))).toBe(true);
  });
});
