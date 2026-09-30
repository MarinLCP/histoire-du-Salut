// Tests unitaires de la logique des notes (fonctions pures : ni React, ni navigateur).

import { describe, test, expect } from 'vitest';
import { setNote } from '../src/notes/notes.js';

describe('setNote', () => {
  const now = new Date('2026-09-30T10:00:00.000Z');

  test('ajoute une note sur un verset, avec la date', () => {
    const notes = setNote(new Map(), 'Gn 1,3', 'La lumière avant le soleil !', now);

    expect(notes.get('Gn 1,3')).toEqual({
      text: 'La lumière avant le soleil !',
      updatedAt: '2026-09-30T10:00:00.000Z',
    });
  });

  test('remplace une note existante', () => {
    const noted = setNote(new Map(), 'Gn 1,3', 'Première idée', now);

    const notes = setNote(noted, 'Gn 1,3', 'Idée corrigée', now);

    expect(notes.get('Gn 1,3').text).toBe('Idée corrigée');
  });

  test.each(['', '   ', '\n'])('une note vide (%j) supprime la note', (emptyText) => {
    const noted = setNote(new Map(), 'Gn 1,3', 'À supprimer', now);

    const notes = setNote(noted, 'Gn 1,3', emptyText, now);

    expect(notes.has('Gn 1,3')).toBe(false);
  });

  test('ne modifie pas l\'ensemble reçu (renvoie un nouvel ensemble)', () => {
    const original = new Map();

    setNote(original, 'Gn 1,3', 'Une note', now);

    expect(original.size).toBe(0);
  });
});
