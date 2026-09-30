// Routes /api/passages

import { Router } from 'express';
import { getPassageBySlug } from '../queries/passages.queries.js';

const router = Router();

// GET /api/passages/:slug : un passage avec ses versets (ex. /api/passages/creation)
router.get('/:slug', async (req, res) => {
  const passage = await getPassageBySlug(req.params.slug);

  if (!passage) {
    return res.status(404).json({ error: `Passage "${req.params.slug}" introuvable.` });
  }

  res.json(passage);
});

export default router;
