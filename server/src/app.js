// Configuration de l'app Express : routes et middlewares.
// Pas de app.listen ici : les tests importent l'app sans démarrer de serveur.

import express from 'express';
import passagesRouter from './routes/passages.routes.js';
import timelineRouter from './routes/timeline.routes.js';

const app = express();

// Route de santé : permet de vérifier que le serveur tourne
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/passages', passagesRouter);
app.use('/api/timeline', timelineRouter);

export default app;
