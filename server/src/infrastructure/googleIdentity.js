// Implémentation du port GoogleIdentity (domain/AccountRepository.js) : OpenID Connect avec Google, flux
// « code », sans librairie (fetch).
// - authorizationUrl : la page de connexion de Google, avec state (lie le retour à ce navigateur), PKCE
//   (code_challenge : seul notre serveur, qui garde le code_verifier, peut échanger le code) et nonce ;
// - exchangeCode : le serveur échange le code contre l'« ID token » (la carte d'identité du lecteur), en
//   parlant DIRECTEMENT à Google en HTTPS, avec notre secret. La norme OpenID (Core, 3.1.3.7) permet alors
//   de se fier au jeton sans vérifier sa signature : il vient de Google, par un canal que Google authentifie.
//   On vérifie quand même l'émetteur, le destinataire (notre identifiant) et l'expiration.

const AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/**
 * @param {{ clientId: string, clientSecret: string, redirectUri: string, now?: () => number }} settings
 *   - redirectUri : l'adresse de retour, la même que dans Google Cloud Console ; now : l'horloge (tests)
 * @returns {import('../domain/AccountRepository.js').GoogleIdentity}
 */
export function createGoogleIdentity({ clientId, clientSecret, redirectUri, now = Date.now }) {
  return {
    authorizationUrl({ state, codeChallenge, nonce }) {
      const query = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
      });
      return `${AUTHORIZATION_URL}?${query}`;
    },

    async exchangeCode({ code, codeVerifier }) {
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri,
          grant_type: 'authorization_code', code_verifier: codeVerifier,
        }),
      });
      if (!response.ok) throw new Error(`Google a refusé l'échange du code (erreur ${response.status}).`);
      const { id_token: idToken } = await response.json();
      return claimsFrom(idToken, { clientId, now: now() });
    },
  };
}

// La charge utile du jeton (sa partie du milieu, en base64url), vérifiée
function claimsFrom(idToken, { clientId, now }) {
  const payload = JSON.parse(Buffer.from(String(idToken).split('.')[1] ?? '', 'base64url').toString('utf8'));
  if (!ISSUERS.includes(payload.iss)) throw new Error('Jeton Google : émetteur inattendu.');
  if (payload.aud !== clientId) throw new Error('Jeton Google : il n\'est pas destiné à ce site.');
  if (!(payload.exp * 1000 > now)) throw new Error('Jeton Google expiré.');
  return {
    sub: String(payload.sub),
    email: String(payload.email ?? ''),
    emailVerified: payload.email_verified === true,
    givenName: typeof payload.given_name === 'string' ? payload.given_name.slice(0, 100) : null,
    nonce: payload.nonce,
  };
}
