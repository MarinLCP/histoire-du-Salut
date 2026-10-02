// Identifiants écrits dans les fichiers de données (slug d'une époque ou d'un ensemble, nom d'un pictogramme) :
// la règle commune des identifiants, définie dans le domaine (domain/identifier.js) : elle ne peut pas diverger.

import { isIdentifier } from '../src/domain/identifier.js';

// Une liste { slug, title, icon } (époques, grands ensembles) : slugs et pictogrammes bien formés, slugs uniques.
// label : ce que désigne la liste dans les messages d'erreur (ex. "Époque")
export function validateSlugList(items, label) {
  const slugs = items.map((item) => item.slug);

  items.forEach((item, index) => {
    const where = `${label} "${item.title}"`;
    if (!isIdentifier(item.slug)) throw new Error(`${where} : slug "${item.slug}" mal formé.`);
    // Un slug déjà vu plus haut dans la liste est un doublon
    if (slugs.indexOf(item.slug) !== index) throw new Error(`${where} : slug "${item.slug}" déjà utilisé.`);
    if (!isIdentifier(item.icon)) throw new Error(`${where} : pictogramme "${item.icon}" mal formé.`);
  });
}
