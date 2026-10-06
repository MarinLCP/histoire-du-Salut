// Hook React : le compte du lecteur. user vaut undefined tant qu'on ne sait pas encore (demande en cours),
// null s'il n'est pas connecté, { email } s'il l'est. Les actions (créer, se connecter...) mettent user à jour ;
// en cas d'échec, elles rejettent avec le message à afficher (ex. « E-mail ou mot de passe incorrect. »).
// createAccount et logIn renvoient ce que dit le serveur : { verificationNeeded, email } quand il faut d'abord
// taper le code reçu par e-mail (verifyEmail).

import { useEffect, useState } from 'react';
import * as accountApi from '../api/account.api.js';

export function useAccount() {
  const [user, setUser] = useState(undefined);

  // Qui est connecté, à l'ouverture du site (serveur injoignable : comme personne)
  useEffect(() => {
    let ignore = false;
    accountApi.fetchCurrentUser()
      .then((session) => { if (!ignore) setUser(session.user); })
      .catch(() => { if (!ignore) setUser(null); });
    return () => {
      ignore = true;
    };
  }, []);

  // Connecté si le serveur a ouvert une session ; renvoie la réponse (pour savoir s'il faut un code)
  const signInWith = (result) => {
    if (result.user) setUser(result.user);
    return result;
  };

  return {
    user,
    createAccount: (form) => accountApi.createAccount(form).then(signInWith),
    verifyEmail: (form) => accountApi.verifyEmail(form).then(signInWith),
    resendEmailCode: (email) => accountApi.resendEmailCode(email),
    logIn: (form) => accountApi.logIn(form).then(signInWith),
    logOut: () => accountApi.logOut().then(() => setUser(null)),
    deleteAccount: (form) => accountApi.deleteAccount(form).then(() => setUser(null)),
  };
}
