// Configuration de l'app Express : routes et middlewares.
// Pas de app.listen ici : les tests importent l'app sans démarrer de serveur.

import express from 'express';
import passagesRouter from './routes/passages.js';

const app = express();

// Route de santé : permet de vérifier que le serveur tourne
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/passages', passagesRouter);

export default app;
