import { Router } from 'express';
import { register, getUserData, verifyToken, getCurrentUser } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/register - Criar novo usuário
router.post('/register', register);

// GET /api/auth/user/:uid - Buscar dados do usuário
router.get('/user/:uid', getUserData);

// POST /api/auth/verify - Verificar token JWT
router.post('/verify', verifyToken);

// GET /api/auth/me - Buscar usuário atual (com token)
router.get('/me', getCurrentUser);

export default router;
