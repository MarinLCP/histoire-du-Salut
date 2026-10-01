// Route /api/health : l'état de santé du serveur ET de la base.
// Render l'appelle régulièrement : une réponse autre que 2xx lui signale un problème.

import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // La plus petite requête possible : on vérifie seulement que la base répond
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'ok' });
  } catch {
    // 503 = "service indisponible" : le serveur tourne, mais il ne peut pas faire son travail
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

export default router;
