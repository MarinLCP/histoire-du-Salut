// Configuration de l'app Express : routes et middlewares.
// Pas de app.listen ici : les tests importent l'app sans démarrer de serveur.

import express from 'express';
import { fileURLToPath } from 'node:url';
import passagesRouter from './routes/passages.routes.js';
import timelineRouter from './routes/timeline.routes.js';

// Le site React une fois construit (cd client && npm run build)
const CLIENT_BUILD = fileURLToPath(new URL('../../client/dist', import.meta.url));

const app = express();

// Route de santé : permet de vérifier que le serveur tourne (Render l'appelle régulièrement)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/passages', passagesRouter);
app.use('/api/timeline', timelineRouter);

// En production, le même serveur envoie aussi le site : index.html, le JS et le CSS.
// Le site et l'API ont ainsi la même adresse (pas de CORS, un seul service à héberger).
// Les liens partagés (/?passage=creation) arrivent sur "/", donc sur index.html.
// En dev, client/dist n'existe pas forcément : c'est Vite qui sert le site (port 5173).
app.use(express.static(CLIENT_BUILD));

export default app;
