// Identifiants écrits dans les fichiers de données (slug d'une époque ou d'un ensemble, nom d'un pictogramme) :
// le même format que le slug d'un passage (minuscules, chiffres, tirets simples, ex. "terre-promise", "sun").
// Une seule règle, définie dans le domaine (PassageSlug) : elle ne peut pas diverger.

import { PassageSlug } from '../src/domain/PassageSlug.js';

export const isDataIdentifier = PassageSlug.isValid;

// Une liste { slug, title, icon } (époques, grands ensembles) : slugs et pictogrammes bien formés, slugs uniques.
// label : ce que désigne la liste dans les messages d'erreur (ex. "Époque")
export function validateSlugList(items, label) {
  const slugs = items.map((item) => item.slug);

  items.forEach((item, index) => {
    const where = `${label} "${item.title}"`;
    if (!isDataIdentifier(item.slug)) throw new Error(`${where} : slug "${item.slug}" mal formé.`);
    // Un slug déjà vu plus haut dans la liste est un doublon
    if (slugs.indexOf(item.slug) !== index) throw new Error(`${where} : slug "${item.slug}" déjà utilisé.`);
    if (!isDataIdentifier(item.icon)) throw new Error(`${where} : pictogramme "${item.icon}" mal formé.`);
  });
}
