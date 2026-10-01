// Tests unitaires du value object PassageSlug (domaine pur : ni Express, ni base).

import { describe, test, expect } from 'vitest';
import { PassageSlug } from '../../src/domain/PassageSlug.js';
import { ValidationError } from '../../src/domain/errors.js';

describe('PassageSlug', () => {
  test.each(['creation', 'appel-abraham', 'resurrection-luc', 'v2'])('accepte le slug "%s"', (text) => {
    expect(new PassageSlug(text).value).toBe(text);
  });

  test.each(['CREATION', 'appel abraham', 'appel--abraham', '-creation', '', '../etc', undefined])(
    'refuse le slug mal formé "%s"',
    (text) => {
      expect(() => new PassageSlug(text)).toThrow(ValidationError);
      expect(PassageSlug.isValid(text)).toBe(false);
    },
  );

  test('est immuable', () => {
    const slug = new PassageSlug('creation');

    expect(() => {
      slug.value = 'chute';
    }).toThrow();
  });
});
