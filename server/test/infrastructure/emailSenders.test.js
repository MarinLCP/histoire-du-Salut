// Tests des envoyeurs d'e-mails et du choix de l'envoyeur selon l'environnement (app.js).

import { describe, test, expect, vi, afterEach } from 'vitest';
import { createBrevoEmailSender, createConsoleEmailSender, createOutboxEmailSender } from '../../src/infrastructure/emailSenders.js';
import { chooseEmailSender } from '../../src/app.js';

const MESSAGE = { to: 'marin@exemple.fr', subject: 'Ton code : 123456', text: 'Voici ton code' };

afterEach(() => vi.unstubAllGlobals());

describe('envoyeurs d\'e-mails', () => {
  test('Brevo : un appel à son API, avec la clé et l\'adresse d\'envoi', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await createBrevoEmailSender({ apiKey: 'cle-secrete', from: 'bonjour@exemple.fr' }).send(MESSAGE);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(options.headers['api-key']).toBe('cle-secrete');
    expect(JSON.parse(options.body)).toMatchObject({ sender: { email: 'bonjour@exemple.fr' }, to: [{ email: 'marin@exemple.fr' }], subject: 'Ton code : 123456' });
  });

  test('Brevo refuse : une erreur (le lecteur le saura)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));

    await expect(createBrevoEmailSender({ apiKey: 'x', from: 'y@exemple.fr' }).send(MESSAGE)).rejects.toThrow('erreur 401');
  });

  test('terminal : le message est affiché, rien n\'est envoyé', async () => {
    const log = vi.fn();

    await createConsoleEmailSender(log).send(MESSAGE);

    expect(log.mock.calls[0][0]).toContain('Ton code : 123456');
  });

  test('boîte de test : le dernier message envoyé à une adresse', async () => {
    const outbox = createOutboxEmailSender(() => {});

    await outbox.send(MESSAGE);
    await outbox.send({ ...MESSAGE, subject: 'Ton code : 654321' });

    expect(outbox.latestTo('marin@exemple.fr').subject).toBe('Ton code : 654321');
    expect(outbox.latestTo('autre@exemple.fr')).toBeUndefined();
  });
});

describe('chooseEmailSender', () => {
  test('Brevo dès que sa clé et l\'adresse d\'envoi existent', () => {
    expect(chooseEmailSender({ BREVO_API_KEY: 'x', EMAIL_FROM: 'y@exemple.fr', NODE_ENV: 'production' }).emailSender).not.toBeNull();
  });

  test('en ligne sans Brevo : personne (jamais la boîte de test, même demandée)', () => {
    expect(chooseEmailSender({ NODE_ENV: 'production', EMAIL_OUTBOX: '1' })).toEqual({ emailSender: null });
  });

  test('en local : la boîte de test si EMAIL_OUTBOX=1, sinon le terminal', () => {
    expect(chooseEmailSender({ EMAIL_OUTBOX: '1' }).testOutbox).toBeDefined();
    expect(chooseEmailSender({}).testOutbox).toBeUndefined();
  });
});
