// Les adresses propres au lecteur (compte, bibliothèque, partage) : un seul réglage, posé UNE fois dans
// createApp.js pour toutes :
// - jamais en cache (ni le navigateur, ni un intermédiaire comme Cloudflare) : la réponse dépend du lecteur ;
// - un corps JSON de 10 ko au plus (sauf une bibliothèque envoyée d'un coup : voir LIBRARY_JSON).

import express from 'express';

export const PRIVATE_PATHS = ['/api/account', '/api/session', '/api/me', '/api/progress', '/api/auth'];
// Une bibliothèque entière peut être envoyée d'un coup (première connexion : ce qui était dans le navigateur)
export const LIBRARY_JSON = express.json({ limit: '1mb' });

export function privateApi() {
  return [express.json({ limit: '10kb' }), noStore];
}

function noStore(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}
