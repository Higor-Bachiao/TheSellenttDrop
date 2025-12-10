import { Router } from 'express';
import { rollGacha, listBoxes, getBox } from '../controllers/gacha.controller';

const router = Router();

// POST /api/gacha/roll - Rolar o gacha (requer autenticação)
router.post('/roll', rollGacha);

// GET /api/gacha/boxes - Listar todas as boxes disponíveis
router.get('/boxes', listBoxes);

// GET /api/gacha/boxes/:id - Buscar box específica com itens
router.get('/boxes/:id', getBox);

export default router;
