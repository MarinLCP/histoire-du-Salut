// Tests des liens vers un chapitre de la Bible entière (/bible?livre=Gn&chapitre=3) : fonctions pures.

import { describe, test, expect } from 'vitest';
import { chapterLink, readChapterLink } from '../../src/bible/bibleLink.js';

describe('chapterLink', () => {
  test('fabrique le lien vers un chapitre', () => {
    expect(chapterLink('Gn', '3')).toBe('/bible?livre=Gn&chapitre=3');
  });

  test('garde les numéros spéciaux et les livres numérotés', () => {
    expect(chapterLink('1S', '9A')).toBe('/bible?livre=1S&chapitre=9A');
  });
});

describe('readChapterLink', () => {
  test('relit le livre et le chapitre de l\'adresse', () => {
    expect(readChapterLink('?livre=Gn&chapitre=3')).toEqual({ book: 'Gn', chapter: '3' });
  });

  test.each(['', '?livre=Gn', '?chapitre=3', '?livre=&chapitre=3'])('adresse "%s" sans chapitre complet : null', (search) => {
    expect(readChapterLink(search)).toBeNull();
  });
});
