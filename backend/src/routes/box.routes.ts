import { Router } from 'express';
import {
  listBoxes,
  getBox,
  createBox,
  updateBox,
  deleteBox
} from '../controllers/box.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/requireAdmin.middleware';

const router = Router();

// GET /api/boxes - Listar todas as boxes (autenticado)
router.get('/', authMiddleware, listBoxes);

// GET /api/boxes/:id - Buscar box específica (autenticado)
router.get('/:id', authMiddleware, getBox);

// POST /api/boxes - Criar nova box (admin)
router.post('/', authMiddleware, requireAdmin, createBox);

// PUT /api/boxes/:id - Atualizar box (admin)
router.put('/:id', authMiddleware, requireAdmin, updateBox);

// DELETE /api/boxes/:id - Deletar box (admin)
router.delete('/:id', authMiddleware, requireAdmin, deleteBox);

export default router;
