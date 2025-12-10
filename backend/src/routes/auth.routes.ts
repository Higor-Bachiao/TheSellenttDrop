import { Router } from 'express';
import { register, getUserData, verifyToken, getCurrentUser, promoteToAdmin, verifyEmail } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/register - Criar novo usuário
router.post('/register', register);

// GET /api/auth/user/:uid - Buscar dados do usuário
router.get('/user/:uid', getUserData);

// POST /api/auth/verify - Verificar token JWT
router.post('/verify', verifyToken);

// GET /api/auth/me - Buscar usuário atual (com token)
router.get('/me', getCurrentUser);

// POST /api/auth/promote-admin - Promover usuário a admin (apenas desenvolvimento)
router.post('/promote-admin', promoteToAdmin);

// POST /api/auth/verify-email - Verificar email manualmente (apenas desenvolvimento)
router.post('/verify-email', verifyEmail);

export default router;
