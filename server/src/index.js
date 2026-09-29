// Point d'entrée de l'API.
// Usage : npm run dev (redémarre à chaque modification) ou npm start

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Route de santé : permet de vérifier que le serveur tourne
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
