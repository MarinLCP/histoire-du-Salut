// Hook React : le partage de progression du lecteur connecté (pseudo et lien), chargé à l'affichage.
// sharing vaut null tant qu'il n'est pas chargé, puis { displayName, token }. Les actions rejettent avec
// le message à afficher en cas d'échec.

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

  const update = (change) => setSharing((previous) => ({ ...previous, ...change }));

  return {
    sharing,
    error,
    saveDisplayName: (displayName) => sharingApi.saveDisplayName(displayName).then(() => update({ displayName: displayName.trim() })),
    openShare: () => sharingApi.openShare().then(({ token }) => {
      update({ token });
      return token;
    }),
    closeShare: () => sharingApi.closeShare().then(() => update({ token: null })),
  };
}
