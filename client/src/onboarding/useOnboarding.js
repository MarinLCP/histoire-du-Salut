// Hook React : la présentation du site pour les nouveaux venus (V11.4).
// - isWelcomeOpen : les cartes d'accueil sont ouvertes (d'elles-mêmes à la première visite, ou par
//   « Revoir la présentation ») ; closeWelcome() les referme pour de bon ; openWelcome() les rouvre ;
// - isHintVisible : l'astuce de l'appui long, montrée une seule fois, après les cartes ; dismissHint() la
//   retire pour de bon (« Compris », ou dès qu'on ouvre le menu d'un verset : on a compris).

import { useCallback, useState } from 'react';
import { hasSeen, markSeen } from './onboarding.storage.js';

export function useOnboarding() {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => !hasSeen('welcome'));
  const [isHintDismissed, setIsHintDismissed] = useState(() => hasSeen('longPressHint'));

  const closeWelcome = useCallback(() => {
    markSeen('welcome');
    setIsWelcomeOpen(false);
  }, []);

  const dismissHint = useCallback(() => {
    markSeen('longPressHint');
    setIsHintDismissed(true);
  }, []);

  return {
    isWelcomeOpen,
    openWelcome: useCallback(() => setIsWelcomeOpen(true), []),
    closeWelcome,
    isHintVisible: !isWelcomeOpen && !isHintDismissed,
    dismissHint,
  };
}
