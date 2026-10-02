// Tests unitaires du value object PageRequest : "quelle page de la timeline ?" (domaine pur).

import { describe, test, expect } from 'vitest';
import { PageRequest, nextCursorOf } from '../../src/domain/PageRequest.js';
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

  test('accepte d\'autres limites (ex. la Bible : 2 chapitres par défaut, 5 au plus)', () => {
    const limits = { defaultLimit: 2, maxLimit: 5 };

    expect(PageRequest.from({}, limits).limit).toBe(2);
    expect(PageRequest.from({ limit: '5' }, limits).limit).toBe(5);
    expect(() => PageRequest.from({ limit: '6' }, limits)).toThrow('`limit` doit être un entier entre 1 et 5.');
  });
});

describe('nextCursorOf', () => {
  test('il reste une suite : le curseur est la position du dernier élément de la page', () => {
    expect(nextCursorOf([{ position: 3 }, { position: 4 }], true)).toBe(4);
  });

  test('plus rien après : pas de curseur (null)', () => {
    expect(nextCursorOf([{ position: 3 }], false)).toBeNull();
    expect(nextCursorOf([], false)).toBeNull();
  });
});
