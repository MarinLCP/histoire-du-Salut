// Tests unitaires des liens de partage (fonctions pures).

import { describe, test, expect } from 'vitest';
import { passageLink, readSharedSlug } from '../src/share/shareLink.js';

describe('passageLink', () => {
  test('construit le lien direct vers un passage', () => {
    expect(passageLink('https://histoire-du-salut.fr', 'creation')).toBe(
      'https://histoire-du-salut.fr/?passage=creation',
    );
  });
});

describe('readSharedSlug', () => {
  test('lit le passage demandé dans l\'adresse', () => {
    expect(readSharedSlug('?passage=serviteur-souffrant')).toBe('serviteur-souffrant');
  });

  test('sans passage dans l\'adresse, renvoie null', () => {
    expect(readSharedSlug('')).toBeNull();
    expect(readSharedSlug('?autre=1')).toBeNull();
  });

  test('un passage vide est ignoré', () => {
    expect(readSharedSlug('?passage=')).toBeNull();
  });

  test('un lien construit par passageLink se relit à l\'identique', () => {
    const url = new URL(passageLink('https://histoire-du-salut.fr', 'appel-abraham'));

    expect(readSharedSlug(url.search)).toBe('appel-abraham');
  });
});
