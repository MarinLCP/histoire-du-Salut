// Chaque pictogramme nommé dans les fichiers de données du serveur a bien un dessin dans le site
// (une faute de frappe, ex. 'tablet' au lieu de 'tablets', ferait sinon un pictogramme de secours).

import { describe, test, expect } from 'vitest';
import { ICONS } from '../../src/frise/iconDrawings.jsx';
import { epochs } from '../../../server/db/epochs.data.js';
import { passages } from '../../../server/db/passages.data.js';
import { bibleGroups } from '../../../server/db/bible-groups.data.js';

const ICON_NAMES = Object.keys(ICONS);

describe('pictogrammes', () => {
  test.each([
    ['epochs.data.js', epochs],
    ['passages.data.js', passages],
    ['bible-groups.data.js', bibleGroups],
  ])('%s : chaque pictogramme a un dessin', (_, items) => {
    const missing = items.map((item) => item.icon).filter((icon) => !ICON_NAMES.includes(icon));

    expect(missing).toEqual([]);
  });

  test('les pictogrammes des livres et des chapitres existent aussi', () => {
    expect(ICON_NAMES).toEqual(expect.arrayContaining(['book', 'pages', 'page']));
  });
});
