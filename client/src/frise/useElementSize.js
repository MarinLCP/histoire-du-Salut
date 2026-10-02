// Hook React : la taille (px) d'un élément, mise à jour quand elle change (fenêtre redimensionnée...).
// La frise en a besoin pour calculer son escalier. Sans ResizeObserver (vieux navigateur) : taille 0, rien n'est dessiné.

import { useEffect, useRef, useState } from 'react';

export function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
