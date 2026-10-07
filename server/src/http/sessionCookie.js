// Le cookie de session : le badge que le navigateur renvoie à chaque requête pour dire « c'est moi ».
// - httpOnly : le JavaScript de la page ne peut pas le lire (une faille XSS ne peut pas le voler) ;
// - Secure (en ligne) : envoyé seulement en HTTPS ;
// - SameSite=Lax : pas envoyé par les requêtes venues d'autres sites (protège des attaques CSRF).

import { SESSION_DAYS } from '../application/sessions.js';

const NAME = 'session';
const MAX_AGE_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

// Le jeton de session envoyé par le navigateur, ou undefined
export function readSessionToken(req) {
  return readCookie(req, NAME);
}

// La valeur d'un cookie, ou undefined (lu à la main : pas besoin de cookie-parser). Nos valeurs (base64url)
// n'ont jamais de « = » ni de « ; »
export function readCookie(req, name) {
  const cookies = (req.headers.cookie ?? '').split(';').map((cookie) => cookie.trim().split('='));
  const found = cookies.find(([cookieName]) => cookieName === name);
  return found?.[1] || undefined;
}

/** @param {import('express').Response} res @param {string} token @param {boolean} secure */
export function setSessionCookie(res, token, secure) {
  res.cookie(NAME, token, { ...cookieOptions(secure), maxAge: MAX_AGE_MS });
}

export function clearSessionCookie(res, secure) {
  res.clearCookie(NAME, cookieOptions(secure));
}

// Les réglages de nos cookies (voir en haut du fichier) ; path : les adresses où le navigateur l'envoie
export function cookieOptions(secure, path = '/') {
  return { httpOnly: true, secure, sameSite: 'lax', path };
}
