// Hook React : la lecture se souvient d'où on en est (ReadingPositionsContext).
// - Pendant la lecture, la position est retenue (sur cet appareil, et dans le compte si on est connecté). Pas
//   tant qu'on n'a pas bougé : ouvrir l'app (au début, ou par un lien) n'écrase pas la position retenue.
// - À l'ouverture de l'app, la lecture revient tout de suite où on en était (« reprendre sa lecture »), une
//   fois par lecture. Pas si on arrive par un lien (passage partagé, chapitre, verset) ou par « Revenir à … » :
//   on va là où le lien mène. Pas non plus si le lecteur a déjà bougé pendant que le compte se chargeait.
// mode : 'history' ou 'bible' ; readingAt : où en est la lecture ; onJump(position) : y aller (useJump)

import { useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { ReadingPositionsContext } from '../library/ReadingPositionsContext.js';

// On retient la position une fois la lecture posée (pas à chaque image du défilement)
const SAVE_DELAY = 1500;

export function useReadingMemory(mode, readingAt, onJump) {
  const { latest, save, resumed } = useContext(ReadingPositionsContext);
  const { search, state } = useLocation();
  const firstPosition = useRef(null);
  const target = latest(mode);

  useEffect(() => {
    if (resumed.has(mode) || target === undefined) return;
    resumed.add(mode);
    const isPlainOpening = search === '' && !state?.scrollToVerse;
    const hasMoved = firstPosition.current !== null && readingAt !== firstPosition.current;
    if (isPlainOpening && target !== null && !hasMoved) onJump(target);
  }, [mode, target, resumed, search, state, readingAt, onJump]);

  useEffect(() => {
    if (readingAt === null) return;
    firstPosition.current ??= readingAt;
    if (readingAt === firstPosition.current) return;

    const timer = setTimeout(() => save(mode, readingAt), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [mode, readingAt, save]);
}
