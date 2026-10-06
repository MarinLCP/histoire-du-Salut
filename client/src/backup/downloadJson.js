// Fait télécharger un fichier JSON par le navigateur (un lien de téléchargement créé puis cliqué en mémoire).

export function downloadJson(fileName, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
}
