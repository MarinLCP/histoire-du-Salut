// Routes /api/passages

import { Router } from 'express';
import { getPassageById } from '../queries/passages.js';

const router = Router();

// GET /api/passages/:id : un passage avec ses versets
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  // :id arrive toujours sous forme de texte ("3", "abc"...) : on vérifie que c'est un entier positif
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "L'identifiant doit être un entier positif." });
  }

  const passage = await getPassageById(id);

  if (!passage) {
    return res.status(404).json({ error: `Passage ${id} introuvable.` });
  }

  res.json(passage);
});

export default router;
