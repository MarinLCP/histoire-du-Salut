// Tests du lecteur de ZIP (un seul fichier compressé dedans) : sur le vrai fichier des parallèles.

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { readSingleFileZip } from '../../../scripts/parallels/zipFile.js';

const zip = readFileSync(new URL('../../../data/cross-references.zip', import.meta.url));

describe('readSingleFileZip', () => {
  test('rend le nom et le texte du fichier compressé', () => {
    const { name, text } = readSingleFileZip(zip);

    expect(name).toBe('cross_references.txt');
    expect(text.startsWith('From Verse\tTo Verse\tVotes')).toBe(true);
    expect(text.split('\n').filter(Boolean)).toHaveLength(344800);
  });

  test('un fichier qui n\'est pas un ZIP est refusé', () => {
    expect(() => readSingleFileZip(Buffer.from('bonjour'))).toThrow('Ce fichier n\'est pas un ZIP lisible.');
  });
});
