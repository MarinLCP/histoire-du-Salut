// @vitest-environment jsdom
// Tests de la section « Mes notes et surlignages » du panneau Paramètres : télécharger et importer une sauvegarde.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BackupSection from '../../src/backup/BackupSection.jsx';

const highlights = new Map([['Gn 1,3', { createdAt: '2026-10-01' }], ['Ex 3,14', { createdAt: '2026-10-02' }]]);
const notes = new Map([['Gn 1,1', { text: 'Au commencement', updatedAt: '2026-10-02' }]]);

function renderSection(onImport = vi.fn().mockResolvedValue(undefined)) {
  const onDownload = vi.fn();
  render(<BackupSection highlights={highlights} notes={notes} onDownload={onDownload} onImport={onImport} />);
  return { onDownload, onImport };
}

// Un fichier choisi dans le sélecteur de fichiers
const chooseFile = (text) => fireEvent.change(screen.getByLabelText('Importer une sauvegarde'), {
  target: { files: [new File([text], 'sauvegarde.json', { type: 'application/json' })] },
});

describe('BackupSection', () => {
  afterEach(cleanup);

  test('dit ce qui sera sauvegardé', () => {
    renderSection();

    expect(screen.getByText('2 surlignages et 1 note')).toBeDefined();
  });

  test('« Télécharger une sauvegarde » donne un fichier daté, avec les surlignages et les notes', () => {
    const { onDownload } = renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Télécharger une sauvegarde' }));

    const [fileName, backup] = onDownload.mock.calls[0];
    expect(fileName).toMatch(/^histoire-du-salut-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/);
    expect(Object.keys(backup.highlights)).toEqual(['Gn 1,3', 'Ex 3,14']);
    expect(Object.keys(backup.notes)).toEqual(['Gn 1,1']);
  });

  test('importer une sauvegarde : ses notes et surlignages sont ajoutés, et c\'est dit', async () => {
    const { onImport } = renderSection();

    chooseFile(JSON.stringify({ format: 'histoire-du-salut', version: 1, highlights: { 'Jn 3,16': {} }, notes: {} }));

    expect(await screen.findByText('Importé : 1 surlignage et 0 note.')).toBeDefined();
    expect(onImport.mock.calls[0][0].highlights).toEqual(new Map([['Jn 3,16', {}]]));
  });

  test('un fichier qui n\'est pas une sauvegarde : rien n\'est importé, et c\'est dit', async () => {
    const { onImport } = renderSection();

    chooseFile('bonjour');

    expect(await screen.findByText('Ce fichier n\'est pas une sauvegarde de L\'histoire d\'un Salut.')).toBeDefined();
    expect(onImport).not.toHaveBeenCalled();
  });

  test('un import qui échoue (compte injoignable) affiche l\'erreur, pas « Importé »', async () => {
    renderSection(vi.fn().mockRejectedValue(new Error('Base indisponible.')));

    chooseFile(JSON.stringify({ format: 'histoire-du-salut', version: 1, highlights: { 'Jn 3,16': {} }, notes: {} }));

    expect(await screen.findByText('Base indisponible.')).toBeDefined();
    expect(screen.queryByText(/Importé/)).toBeNull();
  });
});
