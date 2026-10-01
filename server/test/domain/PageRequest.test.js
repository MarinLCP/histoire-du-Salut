// Tests unitaires du value object PageRequest : "quelle page de la timeline ?" (domaine pur).

import { describe, test, expect } from 'vitest';
import { PageRequest } from '../../src/domain/PageRequest.js';
import { ValidationError } from '../../src/domain/errors.js';

describe('PageRequest', () => {
  test('sans paramètre : depuis le début, 5 passages', () => {
    const page = PageRequest.from({});

    expect(page.after).toBe(0);
    expect(page.limit).toBe(5);
  });

  test('lit les paramètres reçus en texte (comme dans une adresse)', () => {
    const page = PageRequest.from({ after: '3', limit: '20' });

    expect(page.after).toBe(3);
    expect(page.limit).toBe(20);
  });

  test.each(['-1', 'abc', '1.5'])('refuse after=%s', (after) => {
    expect(() => PageRequest.from({ after })).toThrow(ValidationError);
  });

  test.each(['0', '21', 'abc', '2.5'])('refuse limit=%s (entre 1 et 20)', (limit) => {
    expect(() => PageRequest.from({ limit })).toThrow(ValidationError);
  });

  test('est immuable', () => {
    const page = PageRequest.from({});

    expect(() => {
      page.limit = 1000;
    }).toThrow();
  });
});
