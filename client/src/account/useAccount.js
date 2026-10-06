// Hook React : le compte du lecteur. user vaut undefined tant qu'on ne sait pas encore (demande en cours),
// null s'il n'est pas connecté, { email } s'il l'est. Les actions (créer, se connecter...) mettent user à jour ;
// en cas d'échec, elles rejettent avec le message à afficher (ex. « E-mail ou mot de passe incorrect. »).

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

  return {
    user,
    createAccount: (form) => accountApi.createAccount(form).then((session) => setUser(session.user)),
    logIn: (form) => accountApi.logIn(form).then((session) => setUser(session.user)),
    logOut: () => accountApi.logOut().then(() => setUser(null)),
    deleteAccount: (form) => accountApi.deleteAccount(form).then(() => setUser(null)),
  };
}
