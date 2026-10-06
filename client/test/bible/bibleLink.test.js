// Tests des liens vers un chapitre ou un verset de la Bible entière (/bible?livre=Gn&chapitre=3) : fonctions pures.

import { describe, test, expect } from 'vitest';
import { chapterLink, verseLink, readChapterLink } from '../../src/bible/bibleLink.js';

describe('chapterLink', () => {
  test('fabrique le lien vers un chapitre', () => {
    expect(chapterLink('Gn', '3')).toBe('/bible?livre=Gn&chapitre=3');
  });

  test('garde les numéros spéciaux et les livres numérotés', () => {
    expect(chapterLink('1S', '9A')).toBe('/bible?livre=1S&chapitre=9A');
  });
});

describe('verseLink', () => {
  test('fabrique le lien vers un verset', () => {
    expect(verseLink({ book: 'Ml', chapter: '3', verse: '23' })).toBe('/bible?livre=Ml&chapitre=3&verset=23');
  });
});

describe('readChapterLink', () => {
  test('relit le livre et le chapitre de l\'adresse (sans verset : tout le chapitre)', () => {
    expect(readChapterLink('?livre=Gn&chapitre=3')).toEqual({ book: 'Gn', chapter: '3', verse: null });
  });

  test('relit aussi le verset visé', () => {
    expect(readChapterLink('?livre=Ml&chapitre=3&verset=23')).toEqual({ book: 'Ml', chapter: '3', verse: '23' });
  });

  test.each(['', '?livre=Gn', '?chapitre=3', '?livre=&chapitre=3'])('adresse "%s" sans chapitre complet : null', (search) => {
    expect(readChapterLink(search)).toBeNull();
  });
});
