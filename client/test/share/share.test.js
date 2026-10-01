// Tests du partage d'un passage : feuille de partage du téléphone, ou copie du lien en secours.
// Les tests tournent dans Node : on remplace navigator et le presse-papiers par des faux.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { sharePassage } from '../../src/share/share.js';

const passage = { slug: 'creation', title: 'La Création' };
const origin = 'https://histoire-du-salut.fr';
const link = 'https://histoire-du-salut.fr/?passage=creation';

function stubBrowser({ canShare, share = vi.fn().mockResolvedValue(undefined) }) {
  vi.stubGlobal('isSecureContext', canShare);
  vi.stubGlobal('navigator', canShare ? { share } : {});
  return share;
}

describe('sharePassage', () => {
  afterEach(() => vi.unstubAllGlobals());

  test('ouvre la feuille de partage du téléphone quand elle existe', async () => {
    const share = stubBrowser({ canShare: true });
    const copy = vi.fn();

    const result = await sharePassage(passage, { origin, copy });

    expect(share).toHaveBeenCalledWith({ title: 'La Création', url: link });
    expect(copy).not.toHaveBeenCalled();
    expect(result).toBe('shared');
  });

  test('sinon (ordinateur, ou HTTP en dev), copie le lien', async () => {
    stubBrowser({ canShare: false });
    const copy = vi.fn().mockResolvedValue(undefined);

    const result = await sharePassage(passage, { origin, copy });

    expect(copy).toHaveBeenCalledWith(link);
    expect(result).toBe('copied');
  });

  test('si l\'utilisateur ferme la feuille de partage, ce n\'est pas une erreur', async () => {
    const cancelled = Object.assign(new Error('annulé'), { name: 'AbortError' });
    stubBrowser({ canShare: true, share: vi.fn().mockRejectedValue(cancelled) });

    const result = await sharePassage(passage, { origin, copy: vi.fn() });

    expect(result).toBe('cancelled');
  });

  test('une vraie erreur de partage est remontée', async () => {
    stubBrowser({ canShare: true, share: vi.fn().mockRejectedValue(new Error('refusé')) });

    await expect(sharePassage(passage, { origin, copy: vi.fn() })).rejects.toThrow('refusé');
  });
});
