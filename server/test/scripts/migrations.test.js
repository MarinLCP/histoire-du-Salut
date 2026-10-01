// Tests unitaires du choix des migrations à appliquer (fonction pure : pas de base de données).

import { describe, test, expect } from 'vitest';
import { pendingMigrations } from '../../scripts/migrations.js';

describe('pendingMigrations', () => {
  test('sur une base neuve, toutes les migrations sont à appliquer, dans l\'ordre', () => {
    const files = ['002_add_notes.sql', '001_initial_schema.sql'];

    expect(pendingMigrations(files, [])).toEqual(['001_initial_schema.sql', '002_add_notes.sql']);
  });

  test('une migration déjà appliquée n\'est pas rejouée', () => {
    const files = ['001_initial_schema.sql', '002_add_notes.sql'];

    expect(pendingMigrations(files, ['001_initial_schema.sql'])).toEqual(['002_add_notes.sql']);
  });

  test('quand tout est appliqué, il n\'y a rien à faire', () => {
    const files = ['001_initial_schema.sql'];

    expect(pendingMigrations(files, ['001_initial_schema.sql'])).toEqual([]);
  });

  test('les fichiers qui ne sont pas des migrations sont ignorés', () => {
    const files = ['001_initial_schema.sql', 'README.md', '.DS_Store', 'brouillon.sql'];

    expect(pendingMigrations(files, [])).toEqual(['001_initial_schema.sql']);
  });

  test('refuse deux migrations avec le même numéro', () => {
    const files = ['002_add_notes.sql', '002_add_users.sql'];

    expect(() => pendingMigrations(files, [])).toThrow('002');
  });
});
