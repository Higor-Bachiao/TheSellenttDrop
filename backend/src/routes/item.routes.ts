import { Router } from 'express';
import {
  initializeDefaultBox,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  migrateItemsToBox
} from '../controllers/item.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/requireAdmin.middleware';

const router = Router();

// POST /api/items/initialize - Criar box inicial com 6 itens (apenas uma vez)
router.post('/initialize', initializeDefaultBox);

// POST /api/items/migrate - Migrar itens sem boxId para uma box específica
router.post('/migrate', migrateItemsToBox);

// GET /api/items - Listar todos os itens (com filtro opcional por boxId)
router.get('/', authMiddleware, listItems);

// GET /api/items/:id - Buscar item específico
router.get('/:id', authMiddleware, getItem);

// POST /api/items - Criar novo item (admin)
router.post('/', authMiddleware, requireAdmin, createItem);

// PUT /api/items/:id - Atualizar item (admin)
router.put('/:id', authMiddleware, requireAdmin, updateItem);

// DELETE /api/items/:id - Deletar item (admin)
router.delete('/:id', authMiddleware, requireAdmin, deleteItem);

export default router;
