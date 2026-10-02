// Format des identifiants écrits dans les fichiers de données (slug d'une époque, nom d'un pictogramme) :
// le même que le slug d'un passage (minuscules, chiffres, tirets simples, ex. "terre-promise", "sun").
// Une seule règle, définie dans le domaine (PassageSlug) : elle ne peut pas diverger.

import { PassageSlug } from '../src/domain/PassageSlug.js';

export const isDataIdentifier = PassageSlug.isValid;
