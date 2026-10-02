// Hook React : la position de lecture continue (voir readingPosition.js), mise à jour pendant le défilement.
// Une mesure par image au plus (requestAnimationFrame), et aussi quand la page change de taille
// (une page de passages vient de se charger, la fenêtre est redimensionnée).

import { useEffect, useState } from 'react';
import { measureReadingPosition } from './readingPosition.js';

export function useReadingPosition() {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    let frame = null;
    const measure = () => {
      frame = null;
      setPosition(measureReadingPosition());
    };
    const measureSoon = () => {
      frame ??= requestAnimationFrame(measure);
    };

    measureSoon();
    window.addEventListener('scroll', measureSoon, { passive: true });
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureSoon);
    resizeObserver?.observe(document.documentElement);

    return () => {
      window.removeEventListener('scroll', measureSoon);
      resizeObserver?.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return position;
}
