// Routes /api/timeline

import { Router } from 'express';
import { getTimeline } from '../queries/passages.js';

const router = Router();

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

// GET /api/timeline?after=3&limit=5 : les passages qui suivent la position `after`
router.get('/', async (req, res) => {
  // Sans ?after, on part du début ; sans ?limit, on prend la valeur par défaut
  const after = Number(req.query.after ?? 0);
  const limit = Number(req.query.limit ?? DEFAULT_LIMIT);

  if (!Number.isInteger(after) || after < 0) {
    return res.status(400).json({ error: '`after` doit être un entier positif ou nul.' });
  }

  // Une limite maximale évite qu'un client demande toute la base d'un coup
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return res.status(400).json({ error: `\`limit\` doit être un entier entre 1 et ${MAX_LIMIT}.` });
  }

  const timeline = await getTimeline(after, limit);
  res.json(timeline);
});

export default router;
