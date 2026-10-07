// Tests de la limite d'essais de mot de passe (horloge remplacée : pas besoin d'attendre 15 minutes).

import { describe, test, expect } from 'vitest';
import { createAttemptLimiter } from '../../src/http/attemptLimiter.js';

describe('createAttemptLimiter', () => {
  const clock = () => {
    let time = 0;
    return { now: () => time, advance: (ms) => { time += ms; } };
  };

  test('bloqué après 3 échecs, pour cet e-mail seulement', () => {
    const limiter = createAttemptLimiter({ maxAttempts: 3, windowMs: 1000, now: clock().now });

    ['a', 'a', 'a'].forEach((key) => limiter.recordAttempt(key));

    expect(limiter.isBlocked('a')).toBe(true);
    expect(limiter.isBlocked('b')).toBe(false);
  });

  test('débloqué une fois la fenêtre passée', () => {
    const { now, advance } = clock();
    const limiter = createAttemptLimiter({ maxAttempts: 2, windowMs: 1000, now });
    limiter.recordAttempt('a');
    limiter.recordAttempt('a');

    advance(1000);

    expect(limiter.isBlocked('a')).toBe(false);
  });

  test('une connexion réussie remet le compteur à zéro', () => {
    const limiter = createAttemptLimiter({ maxAttempts: 2, windowMs: 1000, now: clock().now });
    limiter.recordAttempt('a');

    limiter.reset('a');
    limiter.recordAttempt('a');

    expect(limiter.isBlocked('a')).toBe(false);
  });

  test('au-delà de 10 000 adresses, le ménage des échecs anciens ne casse pas la limite', () => {
    const { now, advance } = clock();
    const limiter = createAttemptLimiter({ maxAttempts: 1, windowMs: 1000, now });
    for (let index = 0; index < 10000; index++) limiter.recordAttempt(`ancien-${index}`);

    advance(1000);
    limiter.recordAttempt('nouveau');

    expect(limiter.isBlocked('ancien-0')).toBe(false);
    expect(limiter.isBlocked('nouveau')).toBe(true);
  });
});
