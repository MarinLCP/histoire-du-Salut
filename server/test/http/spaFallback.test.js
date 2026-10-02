// Tests du « SPA fallback » : en production, Express envoie aussi le site React.
// Une adresse du site (ex. /bible) doit renvoyer index.html, pour que React affiche la bonne page,
// même si on l'ouvre directement ou qu'on rafraîchit. L'API, elle, garde ses vraies erreurs 404.
// On fabrique un faux site construit dans un dossier temporaire : ni base ni build nécessaires.

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../../src/http/createApp.js';

let clientBuildDirectory;
let app;

beforeAll(async () => {
  clientBuildDirectory = await mkdtemp(join(tmpdir(), 'site-construit-'));
  await writeFile(join(clientBuildDirectory, 'index.html'), '<!doctype html><title>L\'histoire d\'un Salut</title>');
  app = createApp({
    getPassage: async () => ({}),
    getTimeline: async () => ({ passages: [], nextCursor: null }),
    pingDatabase: async () => {},
    clientBuildDirectory,
  });
});

afterAll(() => rm(clientBuildDirectory, { recursive: true, force: true }));

describe('SPA fallback', () => {
  test.each(['/', '/bible', '/bible/gn/1'])('l\'adresse du site "%s" renvoie la page du site', async (address) => {
    const res = await request(app).get(address);

    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('L\'histoire d\'un Salut');
  });

  test('une route API inconnue reste une erreur 404 (pas la page du site)', async () => {
    const res = await request(app).get('/api/inconnu');

    expect(res.status).toBe(404);
    expect(res.text).not.toContain('L\'histoire d\'un Salut');
  });

  test('un fichier manquant du site reste une erreur 404', async () => {
    const res = await request(app).get('/assets/ancien-fichier.js');

    expect(res.status).toBe(404);
  });
});
