// Point d'entrée de l'API : démarre le serveur.
// Usage : npm run dev (redémarre à chaque modification) ou npm start

import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
