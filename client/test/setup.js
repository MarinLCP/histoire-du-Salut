// Préparation commune à tous les tests du client (déclarée dans vite.config.js, test.setupFiles).
// La vue d'ensemble de la frise est gardée en mémoire entre deux appels (api/overview.api.js) :
// chaque test repart sans arbre, pour que le faux fetch d'un test ne serve pas au suivant.
// Le stockage du navigateur (marque-page, surlignages, notes...) est vidé aussi, pour la même raison.
// Avant chaque test, la présentation du site est marquée « déjà vue » : sinon les cartes d'accueil s'ouvriraient
// dans chaque test de l'app. Les tests de la présentation (test/onboarding) retirent cette marque.

import { afterEach, beforeEach } from 'vitest';
import { forgetOverviews } from '../src/api/overview.api.js';
import { markSeen } from '../src/onboarding/onboarding.storage.js';

beforeEach(() => {
  if (!globalThis.localStorage) return;
  markSeen('welcome');
  markSeen('longPressHint');
});

afterEach(() => {
  forgetOverviews();
  globalThis.localStorage?.clear();
});
