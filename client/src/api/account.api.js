// Appels à l'API des comptes. Le jeton de session voyage dans un cookie httpOnly : le site ne le voit
// jamais, le navigateur l'envoie tout seul (même adresse que l'API).

import { getJson, sendJson } from './http.js';

// Renvoie { user } : { email } du lecteur connecté, ou null
export function fetchCurrentUser() {
  return getJson('/api/session');
}

// form : { email, password }. Renvoie { user }, et le lecteur est connecté
export function createAccount(form) {
  return sendJson('POST', '/api/account', form);
}

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
