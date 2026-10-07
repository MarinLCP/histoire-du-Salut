import { afterAll, expect, test } from 'vitest';
import { pool } from '../../src/infrastructure/db.js';

afterAll(() => pool.end());

// Le JIT de PostgreSQL compilerait chaque lecture de passage (~1 s) : il doit être coupé sur nos connexions
test('les connexions de l\'API tournent sans JIT', async () => {
  const { rows } = await pool.query('SHOW jit');

  expect(rows[0].jit).toBe('off');
});
