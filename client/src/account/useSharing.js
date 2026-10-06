// Hook React : le lien de partage de progression du lecteur connecté, chargé à l'affichage.
// sharing vaut null tant qu'il n'est pas chargé, puis { token } (token : null s'il ne partage pas).
// Les actions rejettent avec le message à afficher en cas d'échec.

import { useEffect, useState } from 'react';
import * as sharingApi from '../api/sharing.api.js';

export function useSharing() {
  const [sharing, setSharing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    sharingApi.fetchSharing()
      .then((loaded) => { if (!ignore) setSharing(loaded); })
      .catch((loadError) => { if (!ignore) setError(loadError.message); });
    return () => {
      ignore = true;
    };
  }, []);

  return {
    sharing,
    error,
    openShare: () => sharingApi.openShare().then(({ token }) => {
      setSharing({ token });
      return token;
    }),
    closeShare: () => sharingApi.closeShare().then(() => setSharing({ token: null })),
  };
}
