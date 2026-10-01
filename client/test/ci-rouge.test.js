// Test volontairement faux : vérifie que Render NE déploie PAS quand la CI est rouge (V6.2, 2e essai).
// Ce commit est annulé juste après par un git revert.
import { test, expect } from 'vitest';

test('la CI doit échouer sur ce test', () => {
  expect(1 + 1).toBe(3);
});
