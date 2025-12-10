import { Router } from 'express';
import { listUsers, getUser, updateUserRole, getUserItems } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/requireAdmin.middleware';

const router = Router();

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// GET /api/users/:uid/items - Listar itens do usuário (qualquer usuário autenticado pode ver seus próprios itens)
router.get('/:uid/items', getUserItems);

// Rotas abaixo exigem permissão de admin
router.use(requireAdmin);

// GET /api/users - Listar todos os usuários
router.get('/', listUsers);

// GET /api/users/:uid - Obter usuário específico
router.get('/:uid', getUser);

// PUT /api/users/:uid/role - Atualizar role do usuário
router.put('/:uid/role', updateUserRole);

export default router;
