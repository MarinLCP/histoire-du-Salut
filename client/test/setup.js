// Préparation commune à tous les tests du client (déclarée dans vite.config.js, test.setupFiles).
// La vue d'ensemble de la frise est gardée en mémoire entre deux appels (api/overview.api.js) :
// chaque test repart sans arbre, pour que le faux fetch d'un test ne serve pas au suivant.

import { afterEach } from 'vitest';
import { forgetOverviews } from '../src/api/overview.api.js';

afterEach(() => forgetOverviews());
