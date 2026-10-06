// Appels à l'API des comptes. Le jeton de session voyage dans un cookie httpOnly : le site ne le voit
// jamais, le navigateur l'envoie tout seul (même adresse que l'API).

import { getJson, sendJson } from './http.js';

// Renvoie { user } : { email, hasPassword } du lecteur connecté, ou null
export function fetchCurrentUser() {
  return getJson('/api/session');
}

// Renvoie { google, emailSignUp } : ce que le site peut proposer (Google réglé ? création par e-mail ouverte ?)
export function fetchAuthOptions() {
  return getJson('/api/auth/options');
}

// form : { email, password }. Renvoie { verificationNeeded: true, email } : un code est envoyé par e-mail
export function createAccount(form) {
  return sendJson('POST', '/api/account', form);
}

// form : { email, code }. Renvoie { user } : l'adresse est validée, le lecteur est connecté
export function verifyEmail(form) {
  return sendJson('POST', '/api/account/verify', form);
}

// Un nouveau code par e-mail
export function resendEmailCode(email) {
  return sendJson('POST', '/api/account/code', { email });
}

// Renvoie { user } (connecté), ou { verificationNeeded: true, email } (adresse pas encore validée : code envoyé)
export function logIn(form) {
  return sendJson('POST', '/api/session', form);
}

export function logOut() {
  return sendJson('DELETE', '/api/session');
}

// form : { password } (retapé pour confirmer)
export function deleteAccount(form) {
  return sendJson('DELETE', '/api/account', form);
}
