// Tests de l'API de la bibliothèque du lecteur connecté (supertest + base de dev) : notes privées,
// surlignages, marque-pages ; fusion de ce qui était dans le navigateur (le plus récent gagne) ;
// chacun ne voit que ses données. Comptes de test en @exemple.test, effacés à la fin.

import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import { appWithOutbox, signedUpAgent } from './helpers/accounts.js';
import { pool } from '../../src/infrastructure/db.js';

const TEST_DOMAIN = '@exemple.test';
const PASSWORD = 'un mot de passe long';
const GN_1_3 = encodeURIComponent('Gn 1,3');

afterAll(async () => {
  // Seulement les comptes de CE fichier : les autres fichiers de test tournent en même temps
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`bibliotheque-%${TEST_DOMAIN}`]);
  await pool.end();
});

// Un lecteur connecté (agent : garde son cookie de session)
const world = appWithOutbox();
const { app } = world;

// Un lecteur inscrit, validé, connecté (agent : garde son cookie de session)
function signedInReader() {
  return signedUpAgent(world, `bibliotheque-${Math.random().toString(36).slice(2)}${TEST_DOMAIN}`, 'un mot de passe long');
}

describe('API de la bibliothèque', () => {
  test('un nouveau compte : une bibliothèque vide', async () => {
    const reader = await signedInReader();

    expect((await reader.get('/api/me/library')).body).toEqual({ notes: {}, highlights: {}, bookmarks: {} });
  });

  test('écrire, modifier puis retirer une note', async () => {
    const reader = await signedInReader();

    expect((await reader.put(`/api/me/notes/${GN_1_3}`).send({ text: 'La lumière' })).status).toBe(204);
    await reader.put(`/api/me/notes/${GN_1_3}`).send({ text: 'La lumière, premier jour' });
    expect((await reader.get('/api/me/library')).body.notes['Gn 1,3'].text).toBe('La lumière, premier jour');

    await reader.delete(`/api/me/notes/${GN_1_3}`);
    expect((await reader.get('/api/me/library')).body.notes).toEqual({});
  });

  test('surligner, retirer ; retenir le marque-page de chaque lecture', async () => {
    const reader = await signedInReader();

    await reader.put(`/api/me/highlights/${GN_1_3}`);
    await reader.put('/api/me/bookmarks/bible').send({ position: 300.5 });
    const library = (await reader.get('/api/me/library')).body;
    expect(Object.keys(library.highlights)).toEqual(['Gn 1,3']);
    expect(library.bookmarks).toEqual({ bible: 300.5 });

    await reader.delete(`/api/me/highlights/${GN_1_3}`);
    expect((await reader.get('/api/me/library')).body.highlights).toEqual({});
  });

  test('fusion à la première connexion : la note la plus récente gagne, le marque-page du compte reste', async () => {
    const reader = await signedInReader();
    await reader.put(`/api/me/notes/${GN_1_3}`).send({ text: 'Écrite dans le compte' });
    await reader.put('/api/me/bookmarks/history').send({ position: 20 });

    const res = await reader.post('/api/me/library').send({
      notes: {
        'Gn 1,3': { text: 'Plus ancienne, dans le navigateur', updatedAt: '2020-01-01T00:00:00.000Z' },
        'Jn 3,16': { text: 'Seulement dans le navigateur', updatedAt: '2026-01-01T00:00:00.000Z' },
      },
      highlights: { 'Ps 22,1': { createdAt: '2026-01-01T00:00:00.000Z' } },
      bookmarks: { history: 3, bible: 7 },
    });

    expect(res.status).toBe(200);
    expect(res.body.notes['Gn 1,3'].text).toBe('Écrite dans le compte');
    expect(res.body.notes['Jn 3,16'].text).toBe('Seulement dans le navigateur');
    expect(Object.keys(res.body.highlights)).toEqual(['Ps 22,1']);
    expect(res.body.bookmarks).toEqual({ history: 20, bible: 7 });
  });

  test('chacun ne voit que sa bibliothèque', async () => {
    const [first, second] = [await signedInReader(), await signedInReader()];

    await first.put(`/api/me/notes/${GN_1_3}`).send({ text: 'Ma note privée' });

    expect((await second.get('/api/me/library')).body.notes).toEqual({});
  });

  test('sans être connecté : 401 ; valeurs fausses : 400', async () => {
    const reader = await signedInReader();

    expect((await request(app).get('/api/me/library')).status).toBe(401);
    expect((await request(app).put(`/api/me/notes/${GN_1_3}`).send({ text: 'x' })).status).toBe(401);
    expect((await reader.put('/api/me/notes/n-importe-quoi').send({ text: 'x' })).status).toBe(400);
    expect((await reader.put(`/api/me/notes/${GN_1_3}`).send({ text: '   ' })).status).toBe(400);
    expect((await reader.put('/api/me/bookmarks/autre').send({ position: 1 })).status).toBe(400);
  });

  test('supprimer son compte efface aussi ses notes', async () => {
    const reader = await signedInReader();
    await reader.put(`/api/me/notes/${GN_1_3}`).send({ text: 'À effacer' });

    await reader.delete('/api/account').send({ password: PASSWORD });

    const { rows } = await pool.query('SELECT 1 FROM user_notes WHERE text = $1', ['À effacer']);
    expect(rows).toHaveLength(0);
  });
});
