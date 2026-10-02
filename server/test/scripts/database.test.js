// Tests de la connexion et des transactions des scripts (seed, migrations), avec un faux client
// qui note les requêtes reçues : on vérifie COMMIT / ROLLBACK sans base de données.

import { describe, test, expect } from 'vitest';
import { inTransaction, withClient } from '../../scripts/database.js';

function fakeClient() {
  const queries = [];
  return {
    queries,
    ended: false,
    connect: async () => {},
    query: async (sql) => { queries.push(sql); },
    end: async function end() { this.ended = true; },
  };
}

describe('inTransaction', () => {
  test('tout réussit : BEGIN, le travail, COMMIT', async () => {
    const client = fakeClient();

    await inTransaction(client, () => client.query('INSERT ...'));

    expect(client.queries).toEqual(['BEGIN', 'INSERT ...', 'COMMIT']);
  });

  test('une erreur : ROLLBACK (rien n\'est enregistré), et l\'erreur remonte', async () => {
    const client = fakeClient();

    await expect(inTransaction(client, async () => { throw new Error('ligne refusée'); })).rejects.toThrow('ligne refusée');
    expect(client.queries).toEqual(['BEGIN', 'ROLLBACK']);
  });
});

describe('withClient', () => {
  test('ferme la connexion même en cas d\'erreur (sinon le script ne s\'arrête pas)', async () => {
    const client = fakeClient();

    await expect(withClient(async () => { throw new Error('panne'); }, () => client)).rejects.toThrow('panne');
    expect(client.ended).toBe(true);
  });
});
