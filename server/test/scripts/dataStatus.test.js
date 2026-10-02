// Tests du statut des données proposées par Claude (« proposé ») ou relues par Marin (« validé »).

import { describe, test, expect } from 'vitest';
import { publishable, validateStatus } from '../../scripts/dataStatus.js';

const items = [{ title: 'A', status: 'validé' }, { title: 'B', status: 'proposé' }];

describe('publishable', () => {
  test('en ligne (seed:prod) : seulement ce que Marin a validé', () => {
    expect(publishable(items, { withProposals: false }).map((item) => item.title)).toEqual(['A']);
  });

  test('sur le Mac et dans la CI : tout, pour pouvoir le voir et le tester', () => {
    expect(publishable(items, { withProposals: true })).toHaveLength(2);
  });
});

describe('validateStatus', () => {
  test('un statut inconnu (ou oublié) est refusé', () => {
    expect(() => validateStatus({ status: 'proposé' }, 'Sous-chapitre "A"')).not.toThrow();
    expect(() => validateStatus({}, 'Sous-chapitre "A"')).toThrow(
      'Sous-chapitre "A" : statut "undefined" inconnu (proposé ou validé).',
    );
  });
});
