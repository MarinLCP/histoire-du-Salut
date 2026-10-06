// Tests de la sauvegarde des notes et surlignages (fonctions pures) : créer le fichier, le relire, fusionner.

import { describe, test, expect } from 'vitest';
import { createBackup, readBackup, mergeInto, backupFileName } from '../../src/backup/backup.js';

const highlights = new Map([['Gn 1,3', { createdAt: '2026-10-01' }]]);
const notes = new Map([['Gn 1,1', { text: 'Au commencement', updatedAt: '2026-10-02' }]]);

describe('createBackup / readBackup', () => {
  test('une sauvegarde se relit à l\'identique', () => {
    const text = JSON.stringify(createBackup({ highlights, notes }, '2026-10-06T10:00:00Z'));

    const backup = readBackup(text);

    expect(backup.highlights).toEqual(highlights);
    expect(backup.notes).toEqual(notes);
  });

  test('le fichier dit ce qu\'il est (format, version, date)', () => {
    const backup = createBackup({ highlights, notes }, '2026-10-06T10:00:00Z');

    expect(backup).toMatchObject({ format: 'histoire-du-salut', version: 1, exportedAt: '2026-10-06T10:00:00Z' });
  });

  test.each([
    ['du texte qui n\'est pas du JSON', 'bonjour'],
    ['un autre fichier JSON', '{"name": "autre chose"}'],
  ])('%s : refusé avec un message clair', (_, text) => {
    expect(() => readBackup(text)).toThrow('Ce fichier n\'est pas une sauvegarde de L\'histoire d\'un Salut.');
  });

  test('une version plus récente que l\'app : refusée', () => {
    const text = JSON.stringify({ format: 'histoire-du-salut', version: 2, highlights: {}, notes: {} });

    expect(() => readBackup(text)).toThrow('Cette sauvegarde vient d\'une version plus récente de l\'app.');
  });
});

describe('mergeInto', () => {
  test('ajoute ce qui est importé à ce qu\'on a déjà ; en cas de doublon, le fichier importé gagne', () => {
    const current = new Map([['Gn 1,1', 'ancienne'], ['Ex 3,14', 'gardée']]);
    const imported = new Map([['Gn 1,1', 'importée']]);

    expect(mergeInto(current, imported)).toEqual(new Map([['Gn 1,1', 'importée'], ['Ex 3,14', 'gardée']]));
  });
});

describe('backupFileName', () => {
  test('un nom de fichier daté', () => {
    expect(backupFileName(new Date('2026-10-06T10:00:00Z'))).toBe('histoire-du-salut-sauvegarde-2026-10-06.json');
  });
});
