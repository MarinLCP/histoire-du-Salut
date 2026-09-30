// Hook React : où la timeline doit commencer.
// - Adresse normale : au début (0).
// - Lien partagé (?passage=creation) : juste avant ce passage, pour qu'il soit le premier affiché.
// Renvoie null tant que la position du passage partagé n'est pas connue.

import { useEffect, useState } from 'react';
import { readSharedSlug } from './shareLink.js';
import { fetchPassage } from '../api/passages.api.js';

const START_OF_STORY = 0;

export function useStartPosition() {
  const sharedSlug = readSharedSlug(window.location.search);
  const [startAfter, setStartAfter] = useState(sharedSlug === null ? START_OF_STORY : null);

  useEffect(() => {
    if (sharedSlug === null) return;
    // Si le composant disparaît avant la réponse, on ignore celle-ci
    let ignore = false;

    fetchPassage(sharedSlug)
      .then((passage) => {
        if (!ignore) setStartAfter(passage.position - 1);
      })
      // Lien cassé ou passage supprimé : on montre l'histoire depuis le début plutôt qu'une erreur
      .catch(() => {
        if (!ignore) setStartAfter(START_OF_STORY);
      });

    return () => {
      ignore = true;
    };
  }, [sharedSlug]);

  return startAfter;
}
